import {Utils} from './Utils'

describe('hex2bin', () => {

  test('check if proper buffer is returned', () => {
    const hexStr = "a39dee"
    const buf = Buffer.from([163, 157, 238])
    expect(buf.equals(Utils.hex2bin(hexStr))).toBe(true)
  })

})

describe('utf8DomainToPunycode', () => {

  test('convert utf8 domains', () => {
    expect(Utils.utf8DomainToPunycode('gżegżółka.com')).toBe('xn--gegka-2ta76cmoc.com')
  })

  test('ascii domains shoul be unchanged', () => {
    expect(Utils.utf8DomainToPunycode('some-domain.com.pl')).toBe('some-domain.com.pl')
  })

})