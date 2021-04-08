import tls, {TLSSocket} from 'tls'
import crypto from 'crypto'
import xml2js from 'xml2js'

import {Utils} from './Utils'

export namespace HRDCommon {
  export interface IConfig {
    login: string;
    pass: string;
    hash: string;
  }
}

export namespace HRDConnection {
  export interface IRequestLogin {
    login: {
      login: string;
      pass: string;
      type: 'partnerApi';
    }
  }
}

export namespace HRDModulePartner {

  /**
   * Params interfaces
   * */

  /**
   * Request interfaces
   * */
  export interface IRequestGetBalance {
    partner: {
      getBalance: null;
    }
  }

  export interface IRequestPricingServiceInfo {
    partner: {
      getPricingInfo: {
        name: string;
      }
    }
  }

  export interface IRequestGetPricingsList {
    partner: {
      getPricingsList: null;
    }
  }

  export interface IRequestGetPricings {
    partner: {
      getPricings: null
    }
  }

  /**
   * Response interfaces
   * */
  export interface IResponseGetBalance {

    /** Account balance */
    balance: number;

    /** Restricted balance (for ongoing operations) */
    restrictedBalance: number;
  }

  export interface IResponsePricingServiceInfo {
    // TODO - check response
  }

  export interface IResponseGetPricingsList {
    // TODO - check response
  }

  export interface IResponseGetPricings {
    // TODO - check response
  }

}

export namespace HRDModuleUser {

  export enum UserType {
    PERSON = 'person',
    COMPANY = 'company',
    OWNER = 'owner'
  }

  /**
   * Params interfaces
   * */  
  export interface IParamsUserCreate {
    /** User type */
    type: UserType;

    /** Entity identification number: either PESEL or NIP */
    idNumber: string;

    /** Email address */
    email: string;

    /**
     * Contact phone (landline / mobile) Used as a contact number in registrant type domain contacts
     * Format: +CC.XXXXXXXXX, where CC is Country Code
     * */
    landlinePhone: string;

    /** User name */
    name: string;

    /** Street and number of the building / flat */
    street: string;

    /** Postal code in the correct format for your country */
    postcode: string;

    /** City */
    city: string;

    /** Country according to the ISO 3166-1 alpha-2 standard */
    country: string;

    /** Representative person - used only for type COMPANY */
    representative?: string;
    
    /**
     * (OPTIONAL) Mobile phone number for internal use
     * Format: +CC.XXXXXXXXX, where CC is Country Code
     * */
    mobilePhone?: string;

    /**
     * (OPTIONAL) Fax number
     * Format: +CC.XXXXXXXXX, where CC is Country Code
     * */
    fax?: string;
  }

  export interface IParamsUserUpdate{

    /** Used ID */
    id: number;

    /**
     * (OPTIONAL) Mobile phone number for internal use
     * Format: +CC.XXXXXXXXX, where CC is Country Code
     * */
    mobilePhone?: string;

    /**
     * Contact phone (landline / mobile) Used as a contact number in registrant type domain contacts
     * Format: +CC.XXXXXXXXX, where CC is Country Code
     * */
    landlinePhone?: string;

    /**
     * (OPTIONAL) Fax number
     * Format: +CC.XXXXXXXXX, where CC is Country Code
     * */
    fax?: string;

    /** Street and number of the building / flat */
    street?: string;

    /** Postal code in the correct format for your country */
    postcode?: string;

    /** City */
    city?: string;

    /** Country according to the ISO 3166-1 alpha-2 standard */
    country?: string;
  }

  /**
   * Request interfaces
   * */
   export interface IRequestUserCreate {
    user: {
      create: IParamsUserCreate
    }
  }

  export interface IRequestUserUpdate {
    user: {
      update: IParamsUserUpdate
    }
  }

  /**
   * Response interfaces
   * */
  export interface IResponseUserCreate {
    /** ID of the created user */
    id: number;
  }

  export interface IResponseUserUpdate {}

}

type HRDCreateXml = HRDConnection.IRequestLogin 
| HRDModulePartner.IRequestGetBalance | HRDModulePartner.IRequestPricingServiceInfo | HRDModulePartner.IRequestGetPricingsList | HRDModulePartner.IRequestGetPricings 
| HRDModuleUser.IRequestUserCreate | HRDModuleUser.IRequestUserUpdate

export default class HRDApi {

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

    this.hash = Utils.hex2bin(hash)

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
  public partnerGetBalance(): Promise<HRDModulePartner.IResponseGetBalance> {
    const xml = this.createXML({
      partner: {
        getBalance: null
      }
    })
     // TODO - See what's in response (and parse it properly to get only data in "IResponseGetBalance" type)
    return this.send(xml)
  }

  /**
   * Returns information about the purchase prices of a given service for a partner.
   * 
   * @param     serviceName   Name of the service
   * @returns 
   */
  public partnerPricingServiceInfo(serviceName: string): Promise<HRDModulePartner.IResponsePricingServiceInfo> {
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
  public partnerGetPricingsList(): Promise<HRDModulePartner.IResponseGetPricingsList> {
    const xml = this.createXML({
      partner: {
        getPricingsList: null
      }
    })
    return this.send(xml)
  }

  // TODO - See what's in response / doc
  public partnerGetPricings(): Promise<HRDModulePartner.IResponseGetPricings> {
    const xml = this.createXML({
      partner: {
        getPricings: null
      }
    })
    return this.send(xml)
  }


  // *************** USER MODULE ***************

  /**
   * Create new HRD user
   * 
   * @param     params
   * @returns 
   */
  public userCreate(params: HRDModuleUser.IParamsUserCreate): Promise<HRDModuleUser.IResponseUserCreate> {
    const {type, representative = ''} = params
    
    delete params.type;
    delete params.representative;

    // Add representative only if type = COMPANY or OWNER
    const addRep = [HRDModuleUser.UserType.COMPANY, HRDModuleUser.UserType.OWNER].includes(type);

    const createUserObj = {
      [`${type}Type`]: null,
      representative: addRep ? representative : null,
      ...params
    }

    const xml = this.createXML({
      user: {
        create: createUserObj
      }
    })

    return this.send(xml)
  }

  /**
   * Update HRD user
   * 
   * @param params 
   * @returns
   */
  public userUpdate(params: HRDModuleUser.IParamsUserUpdate): Promise<HRDModuleUser.IResponseUserUpdate> {
    const xml = this.createXML({
      user: {
        update: params
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
   public createXML(params: HRDCreateXml): string {
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

}