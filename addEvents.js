const Moralis = require('moralis-v1/node');
require('dotenv').config();
const contractAddresses = require('./constants/networkMapping.json');
let chainId = process.env.chainId || 31337;
let moralisChainId = chainId == '31337' ? '1337' : chainId;
const contractAddress =
  contractAddresses[chainId]['NftMarketplace'][
    contractAddresses[chainId]['NftMarketplace'].length - 1
  ];

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
const appId = process.env.NEXT_PUBLIC_APP_ID;
const masterKey = process.env.masterKey;

async function main() {
  await Moralis.start({ serverUrl, appId, masterKey });
  console.log(`Working with contract address ${contractAddress}`);

  let itemListedOptions = {
    chainId: moralisChainId,
    address: contractAddress,
    sync_historical: true,
    topic: 'ItemListed(address,address,uint256,uint256)',
    abi: {
      type: 'event',
      anonymous: false,
      name: 'ItemListed',
      inputs: [
        { type: 'address', name: 'seller', indexed: true },
        { type: 'address', name: 'nftAddress', indexed: true },
        { type: 'uint256', name: 'tokenId', indexed: true },
        { type: 'uint256', name: 'price', indexed: false },
      ],
    },
    tableName: 'ItemListed',
  };

  let itemBoughtOptions = {
    chainId: moralisChainId,
    address: contractAddress,
    sync_historical: true,
    topic: 'ItemBought(address,address,uint256,uint256)',
    abi: {
      type: 'event',
      anonymous: false,
      name: 'ItemBought',
      inputs: [
        { type: 'address', name: 'buyer', indexed: true },
        { type: 'address', name: 'nftAddress', indexed: true },
        { type: 'uint256', name: 'tokenId', indexed: true },
        { type: 'uint256', name: 'price', indexed: false },
      ],
    },
    tableName: 'ItemBought',
  };

  let itemCanceledOptions = {
    chainId: moralisChainId,
    address: contractAddress,
    topic: 'ItemCanceled(address, address, uint256)',
    sync_historical: true,
    abi: {
      type: 'event',
      anonymous: false,
      name: 'ItemCanceled',
      inputs: [
        { type: 'address', name: 'seller', indexed: true },
        { type: 'address', name: 'nftAddress', indexed: true },
        { type: 'uint256', name: 'tokenId', indexed: true },
      ],
    },
    tableName: 'ItemCanceled',
  };

  const listedResponse = await Moralis.Cloud.run(
    'watchContractEvent',
    itemListedOptions,
    { useMasterKey: true }
  );

  const boughtResponse = await Moralis.Cloud.run(
    'watchContractEvent',
    itemBoughtOptions,
    { useMasterKey: true }
  );

  const canceledResponse = await Moralis.Cloud.run(
    'watchContractEvent',
    itemCanceledOptions,
    { useMasterKey: true }
  );

  if (
    listedResponse.success &&
    canceledResponse.success &&
    boughtResponse.success
  ) {
    console.log('Success! Database updated with watching events!');
  } else {
    console.log(listedResponse.success, ' << listedResponse');
    console.log(canceledResponse.success, ' << canceledResponse');
    console.log(boughtResponse.success, ' << boughtResponse');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
