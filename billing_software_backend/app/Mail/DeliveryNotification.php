<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DeliveryNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $order,
        public array $items = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your Order #{$this->order['id']} has been delivered!",
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
        $items = $this->items;
        $orderId = $order['id'];
        $customerName = $order['customer_name'] ?? 'Customer';
        $grandTotal = number_format($order['grand_total'] ?? 0, 2);
        $deliveredAt = $order['delivered_at'] ?? now()->format('d M Y, h:i A');
        $trackingId = $order['tracking_id'] ?? '';
        $carrier = $order['carrier'] ?? '';
        $address = $order['shipping_address'] ?? '';
        $paymentMethod = ucfirst(str_replace('_', ' ', $order['payment_method'] ?? ''));
        $paymentStatus = ucfirst($order['payment_status'] ?? '');

        $itemsHtml = '';
        foreach ($items as $item) {
            $name = htmlspecialchars($item['product_name'] ?? 'Product');
            $qty = $item['quantity'] ?? 1;
            $price = number_format($item['price'] ?? 0, 2);
            $size = $item['size'] ?? '';
            $sizeHtml = $size ? "<span style='color:#94a3b8;font-size:12px;margin-left:6px;'>Size: {$size}</span>" : '';
            $itemsHtml .= "
            <tr>
              <td style='padding:12px 0;border-bottom:1px solid #f1f5f9;'>
                <div style='display:flex;align-items:center;gap:12px;'>
                  <div style='flex:1;'>
                    <p style='margin:0;font-size:14px;font-weight:600;color:#1e293b;'>{$name}{$sizeHtml}</p>
                    <p style='margin:2px 0 0;font-size:12px;color:#94a3b8;'>Qty: {$qty}</p>
                  </div>
                  <p style='margin:0;font-size:14px;font-weight:700;color:#2563eb;'>₹{$price}</p>
                </div>
              </td>
            </tr>";
        }

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
            <td style='background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);padding:32px 24px;text-align:center;'>
              <div style='width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;'>
                <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M20 6 9 17l-5-5'/></svg>
              </div>
              <h1 style='margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;'>Order Delivered!</h1>
              <p style='margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;'>Your order has been delivered successfully</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style='padding:28px 28px 0;'>
              <p style='margin:0;font-size:15px;color:#334155;'>Hi <strong>{$customerName}</strong>,</p>
              <p style='margin:8px 0 0;font-size:13px;color:#64748b;line-height:1.6;'>Great news! Your order <strong>#{$orderId}</strong> has been delivered to your doorstep. We hope you love your purchase!</p>
            </td>
          </tr>

          <!-- Delivery Success Card -->
          <tr>
            <td style='padding:20px 28px;'>
              <table width='100%' cellpadding='0' cellspacing='0' style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;overflow:hidden;'>
                <tr>
                  <td style='padding:16px 20px;'>
                    <table width='100%' cellpadding='0' cellspacing='0'>
                      <tr>
                        <td width='40' valign='top'>
                          <div style='width:36px;height:36px;background:#22c55e;border-radius:8px;text-align:center;line-height:36px;'>
                            <span style='font-size:18px;'>✓</span>
                          </div>
                        </td>
                        <td style='padding-left:12px;'>
                          <p style='margin:0;font-size:13px;font-weight:700;color:#166534;'>Delivered Successfully</p>
                          <p style='margin:3px 0 0;font-size:12px;color:#16a34a;'>{$deliveredAt}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>";

        // Tracking & Address Info
        $infoHtml = '';
        if ($trackingId) {
            $infoHtml .= "
          <tr>
            <td style='padding:0 28px 16px;'>
              <table width='100%' cellpadding='0' cellspacing='0' style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;'>
                <tr>
                  <td style='padding:14px 18px;'>
                    <p style='margin:0 0 4px;font-size:10px;font-weight:700;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;'>Tracking ID</p>
                    <p style='margin:0;font-size:15px;font-weight:700;color:#1e40af;font-family:monospace;'>{$trackingId}</p>";
            if ($carrier) {
                $infoHtml .= "<p style='margin:4px 0 0;font-size:12px;color:#64748b;'>Carrier: <strong>{$carrier}</strong></p>";
            }
            $infoHtml .= "
                  </td>
                </tr>
              </table>
            </td>
          </tr>";
        }

        // Items section
        $itemsSection = '';
        if (!empty($itemsHtml)) {
            $itemsSection = "
          <!-- Items -->
          <tr>
            <td style='padding:0 28px;'>
              <p style='margin:0 0 8px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;'>Items Delivered</p>
              <table width='100%' cellpadding='0' cellspacing='0' style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;'>
                <tr>
                  <td style='padding:4px 18px;'>
                    <table width='100%' cellpadding='0' cellspacing='0'>
                      {$itemsHtml}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>";
        }

        // Address
        $addressSection = '';
        if ($address) {
            $escapedAddress = nl2br(htmlspecialchars($address));
            $addressSection = "
          <!-- Address -->
          <tr>
            <td style='padding:16px 28px 0;'>
              <p style='margin:0 0 6px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;'>Delivered To</p>
              <p style='margin:0;font-size:13px;color:#475569;line-height:1.5;'>{$escapedAddress}</p>
            </td>
          </tr>";
        }

        return $infoHtml . $itemsSection . $addressSection . "

          <!-- Total -->
          <tr>
            <td style='padding:20px 28px;'>
              <table width='100%' cellpadding='0' cellspacing='0' style='background:linear-gradient(135deg,#eff6ff,#f0f9ff);border:1px solid #bfdbfe;border-radius:12px;'>
                <tr>
                  <td style='padding:16px 20px;'>
                    <table width='100%' cellpadding='0' cellspacing='0'>
                      <tr>
                        <td><p style='margin:0;font-size:13px;color:#64748b;'>Payment Method</p></td>
                        <td align='right'><p style='margin:0;font-size:13px;font-weight:600;color:#334155;'>{$paymentMethod}</p></td>
                      </tr>
                      <tr>
                        <td><p style='margin:0;font-size:13px;color:#64748b;'>Payment Status</p></td>
                        <td align='right'><p style='margin:0;font-size:13px;font-weight:600;color:#16a34a;'>{$paymentStatus}</p></td>
                      </tr>
                      <tr>
                        <td style='padding-top:10px;'><p style='margin:0;font-size:15px;font-weight:700;color:#1e293b;'>Total Paid</p></td>
                        <td align='right' style='padding-top:10px;'><p style='margin:0;font-size:18px;font-weight:800;color:#2563eb;'>₹{$grandTotal}</p></td>
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
