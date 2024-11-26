export type StyleMap = { [key: string]: any };

export interface ElementNode {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  quad?: number[];
  type: string;
  tag?: string;
  attr?: { [key: string]: any };
  classList?: string[];
  styles?: StyleMap;
  content?: string;
  value?: string;
  exactLineHeight?: number;
  font?: string;
  fontFamily?: string;
  fontWeight?: string | number;
  platformFont?: {
    familyName: string;
    postScriptName: string;
  };
  svg?: string;
  isScrollingElt?: boolean;
  children?: ElementNode[];
}

export interface DocumentData {
  doc?: {
    innerHeight?: number;
    innerWidth?: number;
    fontSize?: number;
    baseURI?: string;
    bgColor?: string;
    styles?: StyleMap;
  };
  frame?: ElementNode;
  fonts?: {
    fontFamily: string;
    fontStyle?: string;
    fontVariant?: string;
    fontWeight?: string | number;
    fontStretch?: string;
    fontDisplay?: string;
    unicodeRange?: string;
    src?: string;
    platformFontFamily?: string;
  }[];
  assets?: { [key: string]: any };
  name?: string;
  width?: number;
  height?: number;
  theme?: string;
}
