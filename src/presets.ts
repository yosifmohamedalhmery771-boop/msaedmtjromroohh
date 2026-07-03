import { ClosingMessagePreset } from './types';

export const CLOSING_MESSAGE_PRESETS: ClosingMessagePreset[] = [
  {
    id: 'quality-gratitude-1',
    label: 'أناقة وامتنان (افتراضي)',
    text: 'نحن ملتزمون بتقديم أعلى مستويات الجودة التي تليق بجمال ذوقكم. تسعدنا لغاية خدمتكم ورؤيتكم متألقين بمنتجاتنا دائماً، وممتنون لثقتكم الغالية بمتجر أم روح. ✨🌸'
  },
  {
    id: 'love-and-care',
    label: 'حب ورعاية التفاصيل',
    text: 'في متجر أم روح، نسجنا لكم الجودة والحب في تفاصيل كل منتج. شاكرين لثقتكم المستمرة، ونسعد دائماً بأن نكون اختياركم المفضل. رضاكم هو غايتنا ومصدر سعادتنا. 💖🌿'
  },
  {
    id: 'excellence-service',
    label: 'التميز والخدمة الراقية',
    text: 'نسعى دائماً لتوفير الأفضل والأكثر تميزاً لتستحقوا الأجمل دائماً. شكراً لاختياركم متجر أم روح، ونتشرف دوماً بخدمتكم بكل حب وتقدير. 🥰🍂'
  },
  {
    id: 'royal-gratitude',
    label: 'فخامة وتقدير للعملاء',
    text: 'منتجاتنا صُنعت بجودة استثنائية واهتمام بالغ لتناسب نمط حياتكم الراقي. شكراً لكونكم جزءاً من عائلة متجر أم روح المتميزة، ونسعد دوماً بلقائكم وتلبية طلباتكم. 💫❤️'
  }
];

export const DEFAULT_SETTINGS = {
  folders: [
    {
      id: '1A2B3C4D5E6F7G8H9I0J',
      name: 'فساتين صيفية 👗',
      link: 'https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J'
    },
    {
      id: '2B3C4D5E6F7G8H9I0J1K',
      name: 'عبايات مناسبات 🖤',
      link: 'https://drive.google.com/drive/folders/2B3C4D5E6F7G8H9I0J1K'
    }
  ],
  whatsappChannelLink: 'https://whatsapp.com/channel/0029Va7ABCD1234',
  whatsappOrderLink: 'https://wa.me/967770000000',
  closingMessage: CLOSING_MESSAGE_PRESETS[0].text
};
