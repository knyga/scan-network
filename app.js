const ping = require('ping');
const _ = require('lodash');
const	query = require('cli-interact').getYesNo;

function detectLocalIps() {
  const networkInterfaces = require('os').networkInterfaces();
  return Object.keys(networkInterfaces).reduce((acc, interfaceKey) => {
    const filterIpsList = ['127.0.0.1', '::'];
    const interfaceDetails = networkInterfaces[interfaceKey];
    for(let i=0; i<interfaceDetails.length; i++) {
      const locator = interfaceDetails[i];
      if(locator && locator.hasOwnProperty('address') && locator.hasOwnProperty('family') && locator.family === 'IPv4') {
        let isAllowed = true;
        for(let j=0; isAllowed && j < filterIpsList.length; j++) {
          if(locator.address.includes(filterIpsList[j]))   {
            isAllowed = false;
          }
        }

        if(isAllowed) {
          acc.push(locator.address);
        }
      }
    }
    return acc;
  }, []);
}

async function scanNetwork(ip) {
  const tail = ip.replace(/\d+$/, '');
  const promises = [];
  for(let i=1; i<254; i++) {
    promises.push(ping.promise.probe(`${tail}${i}`).then((result => {
      if(result.alive) {
        return result.host;
      }

      return null;
    })));
  }

  return Promise.all(promises);
}

async function scanCurrentNetworks() {
  const ips = detectLocalIps();
  const addresses = [];
  for(let i=0; i<ips.length; i++) {
    const localAddresses = await scanNetwork(ips[i]);
    for(let j=0; j<localAddresses.length; j++) {
      if(localAddresses[j] !== null) {
        addresses.push(localAddresses[j]);
      }
    }
  }
  return addresses;
}

(async function() {
  const result1 = await scanCurrentNetworks();
  console.log(result1);
  // console.log('Connect printer');
  // const answer = query('Have you connected printer?');
  // const result2 = await scanCurrentNetworks();
  // const diff = _.differenceWith(result1, result2, _.isEqual);
  // console.log(diff);
})();
