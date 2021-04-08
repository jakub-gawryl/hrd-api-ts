const ESCAPE_MAP = new Map([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['"', '&quot;'],
  ["'", '&#039;']
])

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
}