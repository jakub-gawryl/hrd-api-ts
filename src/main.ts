import tls, {TLSSocket} from 'tls'
import crypto from 'crypto'
import xml2js from 'xml2js'

export namespace HRDCommon {
  export interface IConfig {
    login: string;
    pass: string;
    hash: string;
  }
}

export namespace HRDConnection {
  export interface ILogin {
    login: {
      login: string;
      pass: string;
      type: 'partnerApi';
    }
  }
}

export namespace HRDPartner {

  export interface IGetBalanceResponse {
    balance: number;
    restrictedBalance: number;
  }

  export interface IPricingServiceInfoResponse {
    // TODO - check response
  }

  export interface IGetPricingsListResponse {
    // TODO - check response
  }

  export interface IGetPricingsResponse {
    // TODO - check response
  }

}

// TODO
// export namespace HRDRequest {}
// export namespace HRDResponse {}
//type HRDCreateXml = HRDConnection.ILogin | HRDPartner.IGetBalanceRequest

/* */

export default class HRDApi{

  protected host = 'api.hrd.pl'
  protected port = 9999

  protected hash: Buffer
  protected token: string = ''
  protected isConnected: boolean = false

  protected socket: TLSSocket
  protected xmlParser = new xml2js.Parser()
  protected xmlBuilder = new xml2js.Builder({
    renderOpts: {
      pretty: false
    }
  })

  constructor() {}
  

  // *************** CONNECTION MODULE ***************

  /**
   * Log in to the HRD API with your login, password and hash.
   * This method only needs to be called once at the beginning 
   * 
   * @param     config 
   * @returns   Promise object (resolve returns token)
   */
  public login(config: HRDCommon.IConfig): Promise<string> {
    const {login, pass, hash} = config

    // TODO prevent of login twice!

    this.hash = this.hex2bin(hash)

    return new Promise((resolve, reject) => {
      const xml = this.createXML({
        login: {
          login,
          pass,
          type: 'partnerApi'
        }
      })

      this.send(xml).then(data => {
        const token = data?.api?.token || ''
        const message = data?.api?.message[0]

        if (!token) {
          return reject(`Login failed${message && ` (${message})`}`)
        }
        resolve(token)
      })
    })
  }

  /**
   * Returns HRD token
   * 
   * @returns         Current token
   */
  public getToken(): string {
    return this.token
  }


  // *************** PARTNER MODULE ***************

  /**
   * Returns an account balance and the blocked funds for the operations in progress 
   */
  public partnerGetBalance(): Promise<HRDPartner.IGetBalanceResponse> {
    const xml = this.createXML({
      partner: {
        getBalance: null
      }
    })
     // TODO - See what's in response (and parse it properly to get only data in "IGetBalanceResponse" type)
    return this.send(xml)
  }

  /**
   * Returns information about the purchase prices of a given service for a partner.
   * 
   * @param     serviceName   Name of the service
   * @returns 
   */
  public partnerPricingServiceInfo(serviceName: string): Promise<HRDPartner.IPricingServiceInfoResponse> {
    const xml = this.createXML({
      partner: {
        getPricingInfo: {
          name: serviceName
        }
      }
    })
    return this.send(xml)
  }

  // TODO - See what's in response / doc
  public partnerGetPricingsList(): Promise<HRDPartner.IGetPricingsListResponse> {
    const xml = this.createXML({
      partner: {
        getPricingsList: null
      }
    })
    return this.send(xml)
  }

  // TODO - See what's in response / doc
  public partnerGetPricings(): Promise<HRDPartner.IGetPricingsResponse> {
    const xml = this.createXML({
      partner: {
        getPricingsList: null
      }
    })
    return this.send(xml)
  }


  // *************** UNSUPPORTED ***************

  /**
   * This method is UNSUPPORTED! Please use 'login' method instead!
   */
  public getInstance(): Promise<string> {return Promise.reject(`This method is UNSUPPORTED! Please use 'login' method instead!`)}

   /**
   * This method is UNSUPPORTED! Please use 'login' method instead!
   */
  public getInstanceByPass(): Promise<string> {return Promise.reject(`This method is UNSUPPORTED! Please use 'login' method instead!`)}

  /**
   * This method is UNSUPPORTED! Please use 'login' method instead!
   */
  public getInstanceByToken(): Promise<string> {return Promise.reject(`This method is UNSUPPORTED! Please use 'login' method instead!`)}


  // *************** PROTECTED METHODS ***************

  /**
   * Send request to remote server
   * 
   * @param   xmlData   
   * @returns 
   */
  protected async send(xmlData: string): Promise<any> {

    if  (!this.socket || !this.isConnected) {
      await this.connect()
    }

    return new Promise((resolve, reject) => {
      const sizeBuffer = Buffer.alloc(4)
      const dataBuffer = Buffer.from(xmlData)

      // Calculate sha512 hash
      const hashBuffer = crypto
        .createHash('sha512')
        .update(Buffer.concat([
          dataBuffer,
          this.hash
        ]))
        .digest()

      const hashData = Buffer.concat([
        hashBuffer,
        dataBuffer
      ])

      // Add size
      sizeBuffer.writeUInt32BE(hashData.length)

      const toSend = Buffer.concat([
        sizeBuffer,
        hashData
      ])

      // Solve or discard when data arrives
      this.socket.once('data', (dataBuffer: Buffer) => {
        const dataLength = dataBuffer.slice(0, 4)
        if (dataLength.length !== 4) {
          return reject(`Cannot read response`)
        }

        const xmlData = dataBuffer.slice(4).toString()
        this.xmlParser.parseString(xmlData, (err, data) => {
          if (err) {
            reject(err)
          }
          resolve(data)
        })
        this.socket.end()
      })

      this.socket.write(toSend, (err) => err && reject(err))
    })
  }

  /**
   * Create XML string
   * 
   * @param   params    Params object
   * @returns           XML string
   */
  // TODO - change to protected
   public createXML(params: any): string {
    return this.xmlBuilder.buildObject({
      api: {
        $: {xmlns: 'http://api.hrd.pl/api/'},
        ...params
      }
    })
  }

  /**
   * Connect to remote server
   * 
   * @returns 
   */
  protected connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket = tls.connect({
        host: this.host,
        port: this.port
      }, () => {
        this.isConnected = true
        resolve('')
      })

      this.socket.on('error', err => reject(err))
      this.socket.on('end', () => {
        this.isConnected = false
        this.socket = null
      })
    })
  }

  /**
   * Converts hex string into buffer
   * 
   * @param     hexStr    String to convert eg. "8ef5"
   * @returns             Buffer
   */
  protected hex2bin(hexStr: string): Buffer {
    const bytes = hexStr.match(/.{2}/g).map(str => parseInt(str, 16))
    return Buffer.from(bytes)
  }

}