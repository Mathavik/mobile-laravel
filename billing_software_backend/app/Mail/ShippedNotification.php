<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShippedNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $order,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your Order #{$this->order['id']} has been shipped!",
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    public function attachments(): array
    {
        return [];
    }

    private function buildHtml(): string
    {
        $order = $this->order;
        $orderId = $order['id'];
        $customerName = $order['customer_name'] ?? 'Customer';
        $trackingId = $order['tracking_id'] ?? '';
        $carrier = $order['carrier'] ?? 'Delhivery';
        $estDelivery = $order['estimated_delivery']
            ? \Carbon\Carbon::parse($order['estimated_delivery'])->format('d M Y')
            : 'Coming soon';
        $trackingUrl = $order['tracking_url'] ?? "https://www.delhivery.com/track/package/{$trackingId}";
        $grandTotal = number_format($order['grand_total'] ?? 0, 2);

        return "
<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width,initial-scale=1.0'>
</head>
<body style='margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f8fafc;padding:24px 0;'>
    <tr>
      <td align='center'>
        <table width='100%' cellpadding='0' cellspacing='0' style='max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);'>

          <!-- Header -->
          <tr>
            <td style='background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);padding:32px 24px;text-align:center;'>
              <div style='width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;'>
                <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='1' y='3' width='15' height='13'/><polygon points='16 8 20 8 23 11 23 16 16 16 16 8'/><circle cx='5.5' cy='18.5' r='2.5'/><circle cx='18.5' cy='18.5' r='2.5'/></svg>
              </div>
              <h1 style='margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;'>Order Shipped!</h1>
              <p style='margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;'>Your order is on its way to you</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style='padding:28px 28px 0;'>
              <p style='margin:0;font-size:15px;color:#334155;'>Hi <strong>{$customerName}</strong>,</p>
              <p style='margin:8px 0 0;font-size:13px;color:#64748b;line-height:1.6;'>Great news! Your order <strong>#{$orderId}</strong> has been shipped and is on its way to you.</p>
            </td>
          </tr>";

        // Tracking Card
        $trackingHtml = '';
        if ($trackingId) {
            $trackingHtml = "
          <!-- Tracking Card -->
          <tr>
            <td style='padding:20px 28px;'>
              <table width='100%' cellpadding='0' cellspacing='0' style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;overflow:hidden;'>
                <tr>
                  <td style='padding:20px;'>
                    <p style='margin:0 0 10px;font-size:10px;font-weight:700;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;'>Tracking Details</p>
                    <table width='100%' cellpadding='0' cellspacing='0'>
                      <tr>
                        <td width='50%'>
                          <p style='margin:0;font-size:11px;color:#94a3b8;'>Tracking ID</p>
                          <p style='margin:2px 0 0;font-size:15px;font-weight:700;color:#1e40af;font-family:monospace;'>{$trackingId}</p>
                        </td>
                        <td width='50%'>
                          <p style='margin:0;font-size:11px;color:#94a3b8;'>Carrier</p>
                          <p style='margin:2px 0 0;font-size:14px;font-weight:600;color:#334155;'>{$carrier}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style='padding-top:12px;'>
                          <p style='margin:0;font-size:11px;color:#94a3b8;'>Expected Delivery</p>
                          <p style='margin:2px 0 0;font-size:14px;font-weight:600;color:#16a34a;'>{$estDelivery}</p>
                        </td>
                        <td style='padding-top:12px;'>
                          <p style='margin:0;font-size:11px;color:#94a3b8;'>Order Total</p>
                          <p style='margin:2px 0 0;font-size:14px;font-weight:600;color:#2563eb;'>₹{$grandTotal}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Track Button -->
          <tr>
            <td style='padding:0 28px 20px;text-align:center;'>
              <a href='{$trackingUrl}' target='_blank' style='display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.3px;'>
                Track Your Order →
              </a>
            </td>
          </tr>";
        }

        return $trackingHtml . "

          <!-- Timeline -->
          <tr>
            <td style='padding:0 28px 24px;'>
              <table width='100%' cellpadding='0' cellspacing='0' style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;'>
                <tr>
                  <td style='padding:16px 20px;'>
                    <p style='margin:0 0 12px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;'>What happens next?</p>
                    <table width='100%' cellpadding='0' cellspacing='0'>
                      <tr>
                        <td width='24' valign='top' style='padding-top:2px;'>
                          <div style='width:8px;height:8px;background:#22c55e;border-radius:50%;'></div>
                        </td>
                        <td style='padding:0 0 10px;'>
                          <p style='margin:0;font-size:13px;font-weight:600;color:#334155;'>Order Placed ✓</p>
                          <p style='margin:2px 0 0;font-size:11px;color:#94a3b8;'>Your order has been confirmed</p>
                        </td>
                      </tr>
                      <tr>
                        <td width='24' valign='top' style='padding-top:2px;'>
                          <div style='width:8px;height:8px;background:#22c55e;border-radius:50%;'></div>
                        </td>
                        <td style='padding:0 0 10px;'>
                          <p style='margin:0;font-size:13px;font-weight:600;color:#334155;'>Packed ✓</p>
                          <p style='margin:2px 0 0;font-size:11px;color:#94a3b8;'>Items packed and quality checked</p>
                        </td>
                      </tr>
                      <tr>
                        <td width='24' valign='top' style='padding-top:2px;'>
                          <div style='width:8px;height:8px;background:#2563eb;border-radius:50%;box-shadow:0 0 0 3px rgba(37,99,235,0.2);'></div>
                        </td>
                        <td style='padding:0 0 10px;'>
                          <p style='margin:0;font-size:13px;font-weight:600;color:#2563eb;'>In Transit →</p>
                          <p style='margin:2px 0 0;font-size:11px;color:#94a3b8;'>On the way to your address</p>
                        </td>
                      </tr>
                      <tr>
                        <td width='24' valign='top' style='padding-top:2px;'>
                          <div style='width:8px;height:8px;background:#d1d5db;border-radius:50%;'></div>
                        </td>
                        <td>
                          <p style='margin:0;font-size:13px;color:#94a3b8;'>Delivered</p>
                          <p style='margin:2px 0 0;font-size:11px;color:#cbd5e1;'>Expected by {$estDelivery}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style='padding:0 28px;'><hr style='border:none;border-top:1px solid #e2e8f0;margin:0;'></td>
          </tr>

          <!-- Help -->
          <tr>
            <td style='padding:20px 28px 0;text-align:center;'>
              <p style='margin:0;font-size:12px;color:#94a3b8;line-height:1.6;'>Questions about your order? Contact us at<br><a href='mailto:support@myricekart.in' style='color:#2563eb;font-weight:600;text-decoration:none;'>support@myricekart.in</a></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style='padding:20px 28px 28px;text-align:center;'>
              <p style='margin:0;font-size:11px;color:#cbd5e1;'>Thank you for shopping with us!</p>
              <p style='margin:4px 0 0;font-size:11px;color:#cbd5e1;'>© " . date('Y') . " MyRiceKart. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
    }
}
