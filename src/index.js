import Bigchaindb from "bigchaindb-driver";
import Orm from "bigchaindb-orm";

class VehBigchainDriver {

  constructor(opts) {
      if(!opts){
        opts = {};
      }
      //initialise orm
      this.orm = new Orm( opts.network || "http://188.166.15.225:9984/api/v1/",
                          {  app_id: opts.app_id || '3b959424',
		                         app_key: opts.app_key || '30c12a0e15343d705a7e7ccb6d75f1c0'
                          });
      this.keyPair = opts.keyPair || new this.orm.driver.Ed25519Keypair();
      this.orm.define("devices", "https://schema.org/v1/myModel")

      console.log("keyPair", this.keyPair);

      this.registerDevice = this.registerDevice.bind(this);
      this.getDeviceInfo = this.getDeviceInfo.bind(this);
      this.update = this.update.bind(this);

  }

  async registerDevice(_deviceType, _location, _locationAccuracy, _householdType, _occupants) {
      console.log("BEGINNING REGISTRATION...");
      let asset;
      try {
        asset = await this.orm.models.devices.create({ keypair: this.keyPair,
                              	        data: {
                                                  deviceType: _deviceType,
                                        					location : { type: "Point", coordinates: [ _location.lat, _location.long] }, //GEOJSON easy querying
                                                  locationAccuracy: _locationAccuracy,
                                                  householdType: _householdType,
                                                  occupants: _occupants,
                                                  //readings
                                                  lastUpdate: Date.now(),
                                                  electricityReceived : {
                                                      total: 0,
                                                      tarrif1: 0,
                                                      tariff2: 0
                                                  },
                                                  electricityDelivered : {
                                                      total: 0,
                                                      tarrif1: 0,
                                                      tariff2: 0
                                                  },
                                                  gasReceived: 0
                                        }
        });
      } catch (e) {
        return false;
      }

      return asset.id; //return the device id
  }

  async getDeviceInfo(deviceID) {
    let asset;
    try {
      asset = await this.orm.models.devices.retrieve(deviceID);
    } catch (e) {
      return e
    }
    return asset[0];
  }

  async getAllDevices() {
    let asset;
    try {
      asset = await this.orm.models.devices.retrieve();
    } catch(e) {
      return e
    }
    return asset[0];
  }

  async update(_deviceID, reading) {
      let asset;
      try {
        asset = await this.getDeviceInfo(_deviceID);

        let updatedAsset;
        try {
          updatedAsset = await asset.append({
    	            toPublicKey: this.keyPair.publicKey,
    	            keypair: this.keyPair,
    				data: {
                ...asset.data,
                ...reading,
    				},
    			});
        } catch (e) {
          console.log(e);
        }
      } catch (e) {
        return e;
      }
      return asset;
  }

  // getAssets :: void -> Object
  // Gets all assets from bigchaindb
  async getAssets() {
      let assets = this.orm.models.devices.retrieve()
      return assets;
  }

  async burn(_deviceID) {
      let asset;
      try {
        asset = await this.getDeviceInfo(_deviceID);
      } catch (e) {
        return e;
      }

      let burnedAsset;
      try {
        burnedAsset = await asset.burn({
  	            keypair: this.keyPair
  	        });
      } catch (e) {
        return e;
      }
      return burnedAsset;
  }

}

export default VehBigchainDriver;
