<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CashierController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\CreditController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SubcategoryController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SupplierProductController;
use App\Http\Controllers\Api\WhatsappController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\ShopController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\HomePageBannerController;
use App\Http\Controllers\Api\CelebrationBannerController;

// ── AUTH ROUTES ──
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('update_profile', [AuthController::class, 'updateProfile']);
    Route::post('change_password', [AuthController::class, 'changePassword']);
    Route::post('forgot_password', [AuthController::class, 'forgotPassword']);
    Route::post('send_otp', [AuthController::class, 'sendOtp']);
    Route::post('send_otp_for_credit', [AuthController::class, 'sendOtpForCredit']);
    Route::post('verify_otp', [AuthController::class, 'verifyOtp']);
    Route::get('get_user', [AuthController::class, 'getUser']);
    Route::post('update_profile', [AuthController::class, 'updateProfile']);
    Route::post('change_password', [AuthController::class, 'changePassword']);
    Route::post('logout', [AuthController::class, 'logout']);
});

// ── ADMIN ROUTES ──
Route::prefix('admin')->group(function () {
    Route::post('change_password', [AdminController::class, 'changePassword']);
    Route::post('create_admin', [AdminController::class, 'createAdmin']);
    Route::get('get_admins', [AdminController::class, 'getAdmins']);
    Route::get('get_admin_by_id', [AdminController::class, 'getAdminById']);
    Route::post('toggle_status_admin', [AdminController::class, 'toggleStatusAdmin']);
    Route::post('update_admin', [AdminController::class, 'updateAdmin']);
});

// ── BRAND ROUTES ──
Route::prefix('brand')->group(function () {
    Route::post('create', [BrandController::class, 'create']);
    Route::get('get_active_brand', [BrandController::class, 'getActiveBrand']);
    Route::get('get_all', [BrandController::class, 'getAll']);
    Route::get('get_by_id', [BrandController::class, 'getById']);
    Route::post('status_toggle', [BrandController::class, 'statusToggle']);
    Route::post('update', [BrandController::class, 'update']);
});

// ── CASHIER ROUTES ──
Route::prefix('cashier')->group(function () {
    Route::post('delete_cashier', [CashierController::class, 'deleteCashier']);
    Route::post('get_cashiers', [CashierController::class, 'getCashiers']);
    Route::get('get_cashier_by_id', [CashierController::class, 'getCashierById']);
    Route::post('toggle_status_cashier', [CashierController::class, 'toggleStatusCashier']);
    Route::post('update_cashier', [CashierController::class, 'updateCashier']);
});

// ── CASHIER REQUESTS ROUTES ──
Route::prefix('CashierRequest')->group(function () {
    Route::post('approve_cashier_request', [CashierController::class, 'approveCashierRequest']);
    Route::get('get_cashier_requests', [CashierController::class, 'getCashierRequests']);
    Route::post('reject_cashier_request', [CashierController::class, 'rejectCashierRequest']);
});

// ── CATEGORY ROUTES ──
Route::prefix('category')->group(function () {
    Route::post('create', [CategoryController::class, 'create']);
    Route::post('delete', [CategoryController::class, 'delete']);
    Route::get('get_active_category', [CategoryController::class, 'getActiveCategory']);
    Route::get('get_all', [CategoryController::class, 'getAll']);
    Route::get('get_by_id', [CategoryController::class, 'getById']);
    Route::get('spotlight', [CategoryController::class, 'spotlight']);
    Route::post('toggle_category_status', [CategoryController::class, 'toggleCategoryStatus']);
    Route::post('toggle_spotlight', [CategoryController::class, 'toggleSpotlightActive']);
    Route::post('update', [CategoryController::class, 'update']);
});

// ── COMPANY ROUTES ──
Route::prefix('company')->group(function () {
    Route::post('add_company', [CompanyController::class, 'addCompany']);
    Route::post('delete_company', [CompanyController::class, 'deleteCompany']);
    Route::get('get_companies', [CompanyController::class, 'getCompanies']);
    Route::get('get_companies_by_admin', [CompanyController::class, 'getCompaniesByAdmin']);
    Route::post('get_company_by_id', [CompanyController::class, 'getCompanyById']);
    Route::post('toggle_company_status', [CompanyController::class, 'toggleCompanyStatus']);
    Route::post('update_company', [CompanyController::class, 'updateCompany']);
});

// ── COMPANY REQUESTS ROUTES ──
Route::prefix('CompanyRequest')->group(function () {
    Route::post('approve_company_request', [CompanyController::class, 'approveCompanyRequest']);
    Route::get('get_company_requests', [CompanyController::class, 'getCompanyRequests']);
    Route::post('reject_company_request', [CompanyController::class, 'rejectCompanyRequest']);
});

// ── CREDIT ROUTES ──
Route::prefix('credit')->group(function () {
    Route::get('get', [CreditController::class, 'get']);
    Route::post('save', [CreditController::class, 'save']);
});

// ── CUSTOMER ROUTES ──
Route::prefix('customer')->group(function () {
    Route::post('create_customer', [CustomerController::class, 'createCustomer']);
    Route::post('customer_save', [CustomerController::class, 'customerSave']);
    Route::get('customer_search', [CustomerController::class, 'customerSearch']);
    Route::post('delete', [CustomerController::class, 'delete']);
    Route::get('get_all_customer', [CustomerController::class, 'getAllCustomer']);
    Route::get('get_by_phone', [CustomerController::class, 'getByPhone']);
    Route::get('get_customer_by_id', [CustomerController::class, 'getCustomerById']);
    Route::post('toggle_status_customer', [CustomerController::class, 'toggleStatusCustomer']);
    Route::post('update', [CustomerController::class, 'update']);
});

// ── DASHBOARD ROUTES ──
Route::prefix('dashboard')->group(function () {
    Route::get('get_admin_overdue_notifications', [DashboardController::class, 'getAdminOverdueNotifications']);
    Route::get('get_analytics', [DashboardController::class, 'getAnalytics']);
    Route::get('get_dashboard', [DashboardController::class, 'getDashboard']);
    Route::get('get_stats', [DashboardController::class, 'getStats']);
    Route::get('get_unsold_products_notification', [DashboardController::class, 'getUnsoldProductsNotification']);
});

// ── INVOICE ROUTES ──
Route::prefix('invoice')->group(function () {
    Route::post('create_invoice', [InvoiceController::class, 'createInvoice']);
    Route::get('get_all_invoice', [InvoiceController::class, 'getAllInvoice']);
    Route::get('get_filtered_invoices', [InvoiceController::class, 'getFilteredInvoices']);
    Route::get('get_filtered_pending', [InvoiceController::class, 'getFilteredPending']);
    Route::get('get_invoice_by_id', [InvoiceController::class, 'getInvoiceById']);
    Route::get('get_pending_invoice', [InvoiceController::class, 'getPendingInvoice']);
    Route::get('get_pending_invoice_history', [InvoiceController::class, 'getPendingInvoiceHistory']);
    Route::post('mark_as_paid', [InvoiceController::class, 'markAsPaid']);
    Route::post('payment', [InvoiceController::class, 'payment']);
    Route::post('update_credit_payment', [InvoiceController::class, 'updateCreditPayment']);
    Route::post('pay_customer_bulk', [InvoiceController::class, 'payCustomerBulk']);
    Route::get('get_customer_payments', [InvoiceController::class, 'getCustomerPayments']);
    Route::get('verify_gst', [InvoiceController::class, 'verifyGst']);
});

// ── PRODUCT ROUTES ──
Route::prefix('product')->group(function () {
    Route::post('add', [ProductController::class, 'add']);
    Route::post('bulk_add', [ProductController::class, 'bulkAdd']);
    Route::post('delete', [ProductController::class, 'delete']);
    Route::get('get', [ProductController::class, 'get']);
    Route::get('get_by_id', [ProductController::class, 'getById']);
    Route::get('get_by_supplier', [ProductController::class, 'getBySupplier']);
    Route::get('get_by_code', [ProductController::class, 'getByCode']);
    Route::post('toggle_status_product', [ProductController::class, 'toggleStatusProduct']);
    Route::post('update', [ProductController::class, 'update']);
});

// ── SEARCH ROUTES (PROFESSIONAL KEYWORD SEARCH) ──
Route::prefix('search')->group(function () {
    Route::get('suggestions', [SearchController::class, 'suggestions']);
    Route::get('products', [SearchController::class, 'products']);
});

// ── HOME PAGE BANNERS ROUTES ──
Route::prefix('home-page-banners')->group(function () {
    Route::post('create', [HomePageBannerController::class, 'create']);
    Route::post('delete', [HomePageBannerController::class, 'delete']);
    Route::get('get_all', [HomePageBannerController::class, 'getAll']);
    Route::get('get_active', [HomePageBannerController::class, 'getActive']);
    Route::get('get_by_id', [HomePageBannerController::class, 'getById']);
    Route::post('toggle_status', [HomePageBannerController::class, 'toggleStatus']);
    Route::post('update', [HomePageBannerController::class, 'update']);
});

// ── CELEBRATION BANNER ROUTES ──
Route::prefix('celebration-banners')->group(function () {
    Route::post('create', [CelebrationBannerController::class, 'create']);
    Route::post('delete', [CelebrationBannerController::class, 'delete']);
    Route::get('get_all', [CelebrationBannerController::class, 'getAll']);
    Route::get('get_active', [CelebrationBannerController::class, 'getActive']);
    Route::get('get_by_id', [CelebrationBannerController::class, 'getById']);
    Route::post('toggle_status', [CelebrationBannerController::class, 'toggleStatus']);
    Route::post('update', [CelebrationBannerController::class, 'update']);
});

// ── SUBCATEGORY ROUTES ──
Route::prefix('subcategory')->group(function () {
    Route::post('create', [SubcategoryController::class, 'create']);
    Route::get('get_active_subcategory', [SubcategoryController::class, 'getActiveSubcategory']);
    Route::get('get_all', [SubcategoryController::class, 'getAll']);
    Route::get('get_by_id', [SubcategoryController::class, 'getById']);
    Route::post('statustoggle', [SubcategoryController::class, 'statusToggle']);
    Route::post('update', [SubcategoryController::class, 'update']);
});

// ── SUPPLIER ROUTES ──
Route::prefix('supplier')->group(function () {
    Route::post('create', [SupplierController::class, 'create']);
    Route::get('get_all', [SupplierController::class, 'getAll']);
    Route::get('get_by_id', [SupplierController::class, 'getById']);
    Route::post('toggle_supplier_status', [SupplierController::class, 'toggleSupplierStatus']);
    Route::post('update', [SupplierController::class, 'update']);
});

// ── SUPPLIER PRODUCT ROUTES ──
Route::prefix('supplier_product')->group(function () {
    Route::post('add', [SupplierProductController::class, 'add']);
    Route::get('get_by_id', [SupplierProductController::class, 'getById']);
    Route::get('get_by_supplier', [SupplierProductController::class, 'getBySupplier']);
    Route::post('update', [SupplierProductController::class, 'update']);
});

// ── WHATSAPP ROUTES ──
Route::prefix('whatsapp')->group(function () {
    Route::post('send_reminder', [WhatsappController::class, 'sendReminder']);
});

// ── SHOP / FRONTEND ROUTES ──
Route::prefix('shop')->group(function () {
    Route::get('products', [ShopController::class, 'index']);
    Route::get('products/filters', [ShopController::class, 'filters']);
    Route::get('products/search', [ShopController::class, 'search']);
    Route::get('products/{id}', [ShopController::class, 'show']);
    Route::post('products', [ShopController::class, 'store']);
    Route::post('products/{id}', [ShopController::class, 'update']);
    Route::delete('products/{id}', [ShopController::class, 'destroy']);
    Route::post('products/{id}/toggle-status', [ShopController::class, 'toggleStatus']);

    Route::get('wishlist', [WishlistController::class, 'index']);
    Route::post('wishlist', [WishlistController::class, 'store']);
    Route::post('wishlist/move-to-cart', [WishlistController::class, 'moveToCart']);
    Route::delete('wishlist/{id}', [WishlistController::class, 'destroy']);
    Route::get('wishlist/status', [WishlistController::class, 'status']);
    Route::get('wishlist/count', [WishlistController::class, 'count']);

    Route::get('cart', [CartController::class, 'index']);
    Route::post('cart', [CartController::class, 'store']);
    Route::post('cart/{id}', [CartController::class, 'update']);
    Route::delete('cart/{id}', [CartController::class, 'destroy']);
    Route::delete('cart', [CartController::class, 'clear']);
    Route::get('cart/count', [CartController::class, 'count']);
    Route::get('cart/summary', [CartController::class, 'summary']);

    Route::post('checkout', [CheckoutController::class, 'placeOrder']);
    Route::post('checkout/preview', [CheckoutController::class, 'preview']);

    Route::get('orders', [OrderController::class, 'index']);
    Route::get('orders/{id}', [OrderController::class, 'show']);
    Route::get('orders/{id}/invoice', [OrderController::class, 'invoice']);
});

// ── PURCHASE ROUTES ──
Route::prefix('purchase')->group(function () {
    Route::post('validate_items', [PurchaseController::class, 'validateItems']);
    Route::post('save_draft', [PurchaseController::class, 'saveDraft']);
    Route::post('submit_purchase', [PurchaseController::class, 'submitPurchase']);
    Route::get('get_purchases', [PurchaseController::class, 'getPurchases']);
    Route::get('get_purchase_by_id', [PurchaseController::class, 'getPurchaseById']);
    Route::post('delete_purchase', [PurchaseController::class, 'deletePurchase']);
    Route::post('pay_purchase', [PurchaseController::class, 'payPurchase']);
    Route::get('get_payments', [PurchaseController::class, 'getPurchasePayments']);
    Route::get('get_supplier_payments', [PurchaseController::class, 'getSupplierPayments']);
    Route::post('pay_supplier_bulk', [PurchaseController::class, 'paySupplierBulk']);
});

