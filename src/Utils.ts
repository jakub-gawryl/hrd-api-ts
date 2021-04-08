import {URL} from "url"

export namespace Utils {
  /**
   * Converts hex string into buffer
   * 
   * @param     hexStr    String to convert eg. "8ef5"
   * @returns             Buffer
   */
   export const hex2bin = (hexStr: string): Buffer => {
    const bytes = hexStr.match(/.{2}/g).map(str => parseInt(str, 16))
    return Buffer.from(bytes)
  }

  /**
   * Convert utf8 domains into punycode (ascii)
   * 
   * @param     utf8Domain    Domain in UTF8 (eg. http://ヒキワリ.ナットウ.ニホン)
   * @returns                 ASCII domain (eg. http://xn--nckwd5cta.xn--gckxcpg.xn--idk6a7d)
   */
  export const utf8DomainToPunycode = (utf8Domain: string): string => new URL(`http://${utf8Domain}`).host
}