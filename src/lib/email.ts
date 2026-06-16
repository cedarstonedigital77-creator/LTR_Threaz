import emailjs from '@emailjs/browser'

// ─── EmailJS credentials ──────────────────────────────────────────────────────
// To activate: sign up at emailjs.com, connect your Gmail, create two templates,
// then paste the IDs into your .env file (or Vercel environment variables):
//
//   VITE_EMAILJS_PUBLIC_KEY=your_public_key
//   VITE_EMAILJS_SERVICE_ID=your_service_id
//   VITE_EMAILJS_ORDER_TEMPLATE_ID=your_order_template_id
//   VITE_EMAILJS_NOTIFY_TEMPLATE_ID=your_notify_template_id
//
// Order template variables: {{order_ref}}, {{customer_name}}, {{customer_email}},
//   {{customer_phone}}, {{product_name}}, {{product_color}}, {{product_price}},
//   {{size}}, {{shipping_fee}}, {{total}}, {{country}}, {{location}}, {{delivery_days}}
//
// Notify template variables: {{subscriber_email}}

const PUBLIC_KEY          = import.meta.env.VITE_EMAILJS_PUBLIC_KEY          as string | undefined
const SERVICE_ID          = import.meta.env.VITE_EMAILJS_SERVICE_ID          as string | undefined
const ORDER_TEMPLATE_ID   = import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID   as string | undefined
const NOTIFY_TEMPLATE_ID  = import.meta.env.VITE_EMAILJS_NOTIFY_TEMPLATE_ID  as string | undefined

const ready = !!(PUBLIC_KEY && SERVICE_ID && ORDER_TEMPLATE_ID && NOTIFY_TEMPLATE_ID)

export async function sendOrderEmail(params: {
  orderRef: string
  customerName: string
  customerEmail: string
  customerPhone: string
  productName: string
  productColor: string
  productPrice: string
  size: string
  shippingFee: number
  total: number
  country: string
  location: string
  deliveryDays: string
}) {
  if (!ready) {
    console.warn('[LRT] EmailJS not configured — skipping order email. See src/lib/email.ts for setup instructions.')
    return
  }
  await emailjs.send(
    SERVICE_ID!,
    ORDER_TEMPLATE_ID!,
    {
      order_ref:       params.orderRef,
      customer_name:   params.customerName,
      customer_email:  params.customerEmail,
      customer_phone:  params.customerPhone,
      product_name:    params.productName,
      product_color:   params.productColor,
      product_price:   params.productPrice,
      size:            params.size || 'N/A',
      shipping_fee:    `R${params.shippingFee}`,
      total:           `R${params.total}`,
      country:         params.country,
      location:        params.location,
      delivery_days:   params.deliveryDays,
    },
    PUBLIC_KEY,
  )
}

export async function sendNotifyEmail(subscriberEmail: string) {
  if (!ready) {
    console.warn('[LRT] EmailJS not configured — skipping notify email.')
    return
  }
  await emailjs.send(
    SERVICE_ID!,
    NOTIFY_TEMPLATE_ID!,
    { subscriber_email: subscriberEmail },
    PUBLIC_KEY,
  )
}
