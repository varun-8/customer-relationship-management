/**
 * High-Conversion Status-Driven WhatsApp Sales Copy Generator & Custom Template Manager
 * Tailored specifically for Vasantham Tiles & Sanitary Wares showroom CRM
 */

export const DEFAULT_STATUS_TEMPLATES = {
  followup: `Hello {customerName}! 👋✨\n\nThank you for visiting *{appName}*! 🏛️\nWe were delighted to present our premium Vitrified Tiles, Italian Marble finishes, and Luxury Sanitaryware for your project.\n\nRegarding your requirement for *{requirement}* {quoteValue},\nour design team is ready to help you finalize the ideal tile layout & shade.\n\n📍 Visit our showroom or call us for sample delivery.\n📞 Showroom Helpline: {storePhone}\n\nHave a great day!`,

  quotation: `Hello {customerName}! 📄✨\n\nHere is your official quotation summary from *{appName}*:\n\n💰 *Quotation Value*: *{quoteValue}*\n📦 *Products*: {requirement}\n\nWe guarantee top-grade A-class quality, anti-skid vitrified tiles, and factory-direct pricing for your home!\n\nFeel free to visit our showroom for a live 3D tile layout preview or call us to confirm your delivery.\n\n📞 Showroom Helpline: {storePhone}`,

  negotiation: `Hello {customerName}! 🤝💎\n\nGreat news from *{appName}*!\nFollowing our price discussion for *{requirement}*, our management has approved a *special promotional discount* on your quote {quoteValue}!\n\n✨ *Exclusive Perk*: Free complimentary tile spacers & grout levellers included with your booking today!\n\nThis special pricing is locked for your order. Let's confirm your delivery slot to reserve your tile batch.\n\n📞 Showroom Manager: {storePhone}`,

  order_confirmed: `🎉 *ORDER CONFIRMED!* 🎉\n\nDear {customerName},\n\nThank you for choosing *{appName}* for your dream project! 🏆✨\n\nYour order for *{requirement}* {quoteValue} has been successfully booked!\n\n🚛 *Dispatch & Delivery*: Our warehouse team is packing your tile boxes & sanitary fittings for safe delivery to your site.\n\nShould you need any tile adhesive guidelines or mason advice, feel free to reach us.\n\nWarm regards,\n*{appName}* Team\n📞 Helpline: {storePhone}`,

  lost: `Hello {customerName}! 🌸\n\nGreetings from *{appName}*!\nWe noticed your project requirement was on hold. We would love to serve you for any upcoming tile, sanitary, or waterproofing needs!\n\n✨ As a valued visitor, enjoy a *Special 5% Discount* on any future showroom purchase or home renovation.\n\nVisit us anytime or reach us at 📞 {storePhone}.\nHave a wonderful day!`,
};

export const getStatusTemplates = () => {
  try {
    const saved = localStorage.getItem('vasantham_crm_wa_status_templates');
    if (saved) {
      return { ...DEFAULT_STATUS_TEMPLATES, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return DEFAULT_STATUS_TEMPLATES;
};

export const saveStatusTemplates = (templates) => {
  try {
    localStorage.setItem('vasantham_crm_wa_status_templates', JSON.stringify(templates));
  } catch (e) {}
};

export const generateWhatsAppMessage = (
  customerData = {},
  appName = 'Vasantham Tiles & Sanitary Wares',
  storePhone = '9840123456'
) => {
  const customerName = customerData.customerName || 'Valued Customer';
  const status = customerData.status || 'Follow-up';
  
  let requirement = 'Tiles & Sanitary Wares';
  if (Array.isArray(customerData.requirement)) {
    requirement = customerData.requirement.join(', ');
  } else if (typeof customerData.requirement === 'string' && customerData.requirement.trim()) {
    requirement = customerData.requirement.replace(/([a-z])([A-Z])/g, '$1, $2').replace(/,/g, ', ');
  }

  const rawValue = Number(customerData.quotationValue) || Number(customerData.orderValue) || 0;
  const formattedValue = rawValue ? `₹${rawValue.toLocaleString('en-IN')}` : '';

  const templates = getStatusTemplates();
  let key = 'followup';
  if (status === 'Order Confirmed') key = 'order_confirmed';
  else if (status === 'Negotiation') key = 'negotiation';
  else if (status === 'Quotation') key = 'quotation';
  else if (status === 'Lost') key = 'lost';

  const rawTemplate = templates[key] || DEFAULT_STATUS_TEMPLATES[key] || DEFAULT_STATUS_TEMPLATES.followup;

  const interpolated = rawTemplate
    .replace(/\{customerName\}/g, customerName)
    .replace(/\{appName\}/g, appName)
    .replace(/\{storePhone\}/g, storePhone)
    .replace(/\{phone\}/g, storePhone)
    .replace(/\{requirement\}/g, requirement)
    .replace(/\{products\}/g, requirement)
    .replace(/\{quoteValue\}/g, formattedValue ? formattedValue : 'Estimate');

  return encodeURIComponent(interpolated);
};

export const getWhatsAppUrl = (phone, customerData, appName = 'Vasantham Tiles & Sanitary Wares', storePhone = '9840123456') => {
  if (!phone) return '#';
  const cleanPhone = String(phone).replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const encodedMsg = generateWhatsAppMessage(customerData, appName, storePhone);
  return `https://wa.me/${waNumber}?text=${encodedMsg}`;
};
