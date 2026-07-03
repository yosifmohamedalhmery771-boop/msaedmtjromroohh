export interface FolderConfig {
  id: string;
  name: string;
  link: string;
}

export interface Settings {
  folders: FolderConfig[];
  whatsappChannelLink: string;
  whatsappOrderLink: string;
  closingMessage: string;
}

export interface ClosingMessagePreset {
  id: string;
  label: string;
  text: string;
}
