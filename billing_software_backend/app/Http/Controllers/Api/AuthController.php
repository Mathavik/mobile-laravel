<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Company;
use App\Models\CashierRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $email = trim($request->input('email', ''));
        $password = trim($request->input('password', ''));

        if (!$email || !$password) {
            return response()->json([
                "status" => false,
                "message" => "Email & Password required"
            ]);
        }

        // 1. CHECK USERS TABLE
        $user = User::where('email', $email)->first();

        if ($user) {
            if (!empty($user->status) && $user->status != 'active') {
                return response()->json([
                    "status" => false,
                    "message" => "Your account is inactive. Contact admin."
                ]);
            }

            if (Hash::check($password, $user->password)) {
                if ($user->active_token) {
                    return response()->json([
                        "status" => false,
                        "message" => "This account is already logged in on another device."
                    ]);
                }

                $token = Str::random(60);
                $user->update(['active_token' => $token]);

                if ($user->role === 'cashier') {
                    $admin = User::find($user->admin_id);
                    if ($admin && $admin->email) {
                        try {
                            Mail::raw("Cashier {$user->name} ({$user->email}) has successfully logged in at " . now()->toDateTimeString(), function ($message) use ($admin) {
                                $message->to($admin->email)->subject("Cashier Login Notification");
                            });
                        } catch (\Exception $e) {
                            logger()->error("Failed to send cashier login notification to admin: " . $e->getMessage());
                        }
                    }
                }

                return response()->json([
                    "status" => true,
                    "role"   => $user->role,
                    "active_token" => $token,
                    "data"   => [
                        "id"         => $user->id,
                        "name"       => $user->name,
                        "email"      => $user->email,
                        "phone"      => $user->phone,
                        "address"    => $user->address,
                        "company_id" => $user->company_id,
                        "admin_id"   => $user->admin_id
                    ]
                ]);
            }
        }

        // 2. CHECK COMPANIES TABLE (ADMIN LOGIN)
        $company = Company::where('owner_email', $email)->first();

        if ($company) {
            if (Hash::check($password, $company->owner_password)) {
                return response()->json([
                    "status" => true,
                    "role"   => "admin",
                    "data"   => [
                        "id"         => $company->id,
                        "name"       => $company->company_name,
                        "email"      => $company->owner_email,
                        "company_id" => $company->id
                    ]
                ]);
            }
        }

        return response()->json([
            "status" => false,
            "message" => "Invalid credentials"
        ]);
    }

    public function register(Request $request)
    {
        $name = $request->input('name', '');
        $email = $request->input('email', '');
        $password = $request->input('password', '');
        $role = $request->input('role', '');
        $admin_id = intval($request->input('admin_id', 0));
        $company_id = intval($request->input('company_id', 0));
        $requested_by = intval($request->input('requested_by', 0));
        $phone = trim($request->input('phone', ''));
        $address = trim($request->input('address', ''));

        if (!$name || !$email || !$password || !$role) {
            return response()->json([
                "status" => false,
                "message" => "All fields required"
            ]);
        }

        if (!in_array($role, ['superadmin', 'cashier', 'admin', 'user'])) {
            return response()->json([
                "status" => false,
                "message" => "Invalid role"
            ]);
        }

        if ($role === 'cashier' && !$admin_id) {
            return response()->json([
                "status" => false,
                "message" => "Admin ID required"
            ]);
        }

        $check = User::where('email', $email)->exists();
        if ($check) {
            return response()->json([
                "status" => false,
                "message" => "Email already exists"
            ]);
        }

        $hashed = Hash::make($password);

        if ($role == 'cashier') {
            $totalCashiers = User::where('admin_id', $admin_id)->where('role', 'cashier')->count();
            if ($totalCashiers >= 3) {
                CashierRequest::create([
                    'admin_id' => $admin_id,
                    'requested_by' => $requested_by ?: null,
                    'name' => $name,
                    'email' => $email,
                    'password' => $hashed
                ]);

                return response()->json([
                    "status" => false,
                    "request_sent" => true,
                    "message" => "Cashier limit reached. Request sent to Super Admin."
                ]);
            }
        }

        DB::beginTransaction();
        try {
            User::create([
                'name' => $name,
                'email' => $email,
                'password' => $hashed,
                'role' => $role,
                'admin_id' => $admin_id ?: null,
                'company_id' => $company_id ?: null,
                'phone' => $phone ?: null,
                'address' => $address ?: null,
                'status' => 'active',
            ]);

            if ($role == 'admin' && $company_id > 0) {
                Company::where('id', $company_id)->update([
                    'owner_name' => $name,
                    'owner_email' => $email,
                    'owner_password' => $hashed
                ]);
            }

            DB::commit();

            return response()->json([
                "status" => true,
                "message" => "User registered successfully"
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                "status" => false,
                "message" => $e->getMessage()
            ]);
        }
    }

    public function forgotPassword(Request $request)
    {
        $email = $request->input('email', '');
        $new_password = $request->input('password', '');

        if (!$email || !$new_password) {
            return response()->json([
                "status" => false,
                "message" => "Email & password required"
            ]);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json([
                "status" => false,
                "message" => "Email not found"
            ]);
        }

        $hashed = Hash::make($new_password);

        DB::beginTransaction();
        try {
            $user->update(['password' => $hashed]);

            if ($user->role == 'admin' && $user->company_id > 0) {
                Company::where('id', $user->company_id)->update([
                    'owner_password' => $hashed
                ]);
            }

            DB::commit();
            return response()->json([
                "status" => true,
                "message" => "Password updated successfully 🔥"
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                "status" => false,
                "message" => $e->getMessage()
            ]);
        }
    }

    public function sendOtp(Request $request)
    {
        $email = $request->input('email');
        if (!$email) {
            return response()->json(["status" => "error", "message" => "Email required"]);
        }

        $otp = rand(100000, 999999);
        $expiry = date("Y-m-d H:i:s", strtotime("+5 minutes"));

        try {
            $user = User::where('email', $email)->first();
            if ($user) {
                $user->update([
                    'otp' => $otp,
                    'otp_expiry' => $expiry
                ]);
            } else {
                User::create([
                    'email' => $email,
                    'otp' => $otp,
                    'otp_expiry' => $expiry,
                    'status' => 'inactive'
                ]);
            }

            try {
                Mail::raw("Your OTP is: $otp", function ($message) use ($email) {
                    $message->to($email)->subject("Your OTP Code");
                });
            } catch (\Exception $mailEx) {
                if (config('app.env') === 'local') {
                    return response()->json([
                        "status" => "success",
                        "message" => "OTP generated (Local test mode): " . $otp
                    ]);
                }
                throw $mailEx;
            }

            return response()->json(["status" => "success", "message" => "OTP sent"]);
        } catch (\Exception $e) {
            return response()->json(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    public function sendOtpForCredit(Request $request)
    {
        $user_id = intval($request->input('user_id'));
        $role = $request->input('role');

        if (!$user_id || !$role) {
            return response()->json(["status" => "error", "message" => "User ID and Role required"]);
        }

        $email = null;

        if ($role === 'admin') {
            $user = User::find($user_id);
            if ($user && $user->email) {
                $email = $user->email;
            } else {
                $company = Company::find($user_id);
                if ($company && $company->owner_email) {
                    $email = $company->owner_email;
                }
            }
        } elseif ($role === 'cashier') {
            $cashier = User::find($user_id);
            if ($cashier && $cashier->admin_id) {
                $admin = User::find($cashier->admin_id);
                if ($admin && $admin->email) {
                    $email = $admin->email;
                } else {
                    $company = Company::find($cashier->admin_id);
                    if ($company && $company->owner_email) {
                        $email = $company->owner_email;
                    }
                }
            }
        }

        if (!$email) {
            return response()->json(["status" => "error", "message" => "Admin email not found"]);
        }

        $otp = rand(100000, 999999);
        $expiry = date("Y-m-d H:i:s", strtotime("+5 minutes"));

        try {
            $targetUser = User::where('email', $email)->first();
            if ($targetUser) {
                $targetUser->update([
                    'otp' => $otp,
                    'otp_expiry' => $expiry
                ]);
            }

            try {
                Mail::raw("Your OTP for authorizing Customer Credit Limit is: $otp", function ($message) use ($email) {
                    $message->to($email)->subject("Credit Limit Verification OTP");
                });
            } catch (\Exception $mailEx) {
                if (config('app.env') === 'local') {
                    return response()->json([
                        "status" => "success",
                        "email" => $email,
                        "message" => "OTP generated (Local test mode): " . $otp
                    ]);
                }
                throw $mailEx;
            }

            return response()->json([
                "status" => "success",
                "email" => $email,
                "message" => "OTP sent successfully to " . $email
            ]);
        } catch (\Exception $e) {
            return response()->json(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    public function verifyOtp(Request $request)
    {
        $email = $request->input('email');
        $otp   = $request->input('otp');

        if (!$email || !$otp) {
            return response()->json(["status" => "error", "message" => "Email and OTP required"]);
        }

        $user = User::where('email', $email)
                    ->where('otp', $otp)
                    ->where('otp_expiry', '>', now())
                    ->first();

        if ($user) {
            return response()->json([
                "status" => "success",
                "message" => "Login successful"
            ]);
        } else {
            return response()->json([
                "status" => "error",
                "message" => "Invalid or expired OTP"
            ]);
        }
    }

    public function getUser(Request $request)
    {
        $id = intval($request->input('id') ?: $request->query('id', 0));
        $role = $request->input('role', '');

        if (!$id) {
            return response()->json([
                "status" => false,
                "message" => "id required"
            ]);
        }

        // Admin accounts that logged in via the companies table (id = company id)
        if ($role === 'admin') {
            $company = Company::where('id', $id)->where('is_deleted', 0)->first();
            if ($company) {
                return response()->json([
                    "status" => true,
                    "role"   => "admin",
                    "data"   => [
                        "id"         => $company->id,
                        "name"       => $company->company_name,
                        "email"      => $company->owner_email,
                        "company_id" => $company->id,
                        "admin_id"   => null
                    ]
                ]);
            }
            // else fall through to the users table (admin accounts created there)
        }

        // All other accounts live in the users table
        $user = User::where('id', $id)->first();
        if (!$user) {
            return response()->json([
                "status" => false,
                "message" => "User not found"
            ]);
        }

        return response()->json([
            "status" => true,
            "role"   => $user->role,
            "data"   => [
                "id"         => $user->id,
                "name"       => $user->name,
                "email"      => $user->email,
                "phone"      => $user->phone,
                "address"    => $user->address,
                "company_id" => $user->company_id,
                "admin_id"   => $user->admin_id
            ]
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user_id = intval($request->input('user_id', 0));
        $name    = trim($request->input('name', ''));
        $phone   = trim($request->input('phone', ''));
        $address = trim($request->input('address', ''));

        if (!$user_id) {
            return response()->json([
                "status" => false,
                "message" => "user_id required"
            ]);
        }

        $user = User::where('id', $user_id)->first();
        if (!$user) {
            return response()->json([
                "status" => false,
                "message" => "User not found"
            ]);
        }

        if ($phone && !preg_match('/^[0-9]{10}$/', $phone)) {
            return response()->json([
                "status" => false,
                "message" => "Phone must be 10 digits"
            ]);
        }

        $user->update([
            'name'    => $name ?: $user->name,
            'phone'   => $phone ?: $user->phone,
            'address' => $address ?: $user->address
        ]);

        return response()->json([
            "status" => true,
            "role"   => $user->role,
            "data"   => [
                "id"         => $user->id,
                "name"       => $user->name,
                "email"      => $user->email,
                "phone"      => $user->phone,
                "address"    => $user->address,
                "company_id" => $user->company_id,
                "admin_id"   => $user->admin_id
            ]
        ]);
    }

    public function changePassword(Request $request)
    {
        $user_id           = intval($request->input('user_id', 0));
        $current_password  = (string) $request->input('current_password', '');
        $new_password      = (string) $request->input('new_password', '');

        if (!$user_id || !$current_password || !$new_password) {
            return response()->json([
                "status" => false,
                "message" => "All fields required"
            ]);
        }

        if (strlen($new_password) < 6) {
            return response()->json([
                "status" => false,
                "message" => "New password must be at least 6 characters"
            ]);
        }

        $user = User::where('id', $user_id)->first();
        if (!$user) {
            return response()->json([
                "status" => false,
                "message" => "User not found"
            ]);
        }

        if (!Hash::check($current_password, $user->password)) {
            return response()->json([
                "status" => false,
                "message" => "Current password is incorrect"
            ]);
        }

        $user->update(['password' => Hash::make($new_password)]);

        return response()->json([
            "status" => true,
            "message" => "Password changed successfully"
        ]);
    }

    public function logout(Request $request)
    {
        $id = intval($request->input('id'));
        $role = $request->input('role');

        if ($id) {
            $user = User::where('id', $id)->first();
            if ($user && $user->role === $role) {
                $user->update(['active_token' => null]);
            }
        }

        return response()->json([
            "status" => true,
            "message" => "Logged out successfully"
        ]);
    }
}
