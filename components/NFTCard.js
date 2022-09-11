import styles from '../styles/Home.module.css';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useWeb3Contract, useMoralis } from 'react-moralis';
import nftAbi from '../constants/BasicNft.json';
import { useNotification } from 'web3uikit';
import nftMarketplaceAbi from '../constants/NftMarketplace.json';
import networkMapping from '../constants/networkMapping.json';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import UpdateListingModal from './UpdateListingModal';
import Swal from 'sweetalert2';

const truncateStr = (fullStr, strLen) => {
  if (fullStr.length <= strLen) return fullStr;

  const separator = '...';
  const seperatorLength = separator.length;
  const charsToShow = strLen - seperatorLength;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return (
    fullStr.substring(0, frontChars) +
    separator +
    fullStr.substring(fullStr.length - backChars)
  );
};

export default function NFTCard({
  nftAddress,
  tokenId,
  seller,
  price,
  setUpdateCancel,
  updateCancel,
}) {
  const { isWeb3Enabled, account, chainId } = useMoralis();
  const [imageURI, setImageURI] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  const chainString = chainId ? parseInt(chainId).toString() : '31337';
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [modalEvent, setModalEvent] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const alphabets = [
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
  ];
  let counter = 0;
  const hideModal = () => {
    setShowModal(false);
    setUpdateCancel('updated' + counter.toString());
    counter++;
  };

  const { runContractFunction } = useWeb3Contract();

  const marketplaceAddress = networkMapping[chainString].NftMarketplace[0];

  const dispatch = useNotification();

  const { runContractFunction: getTokenURI } = useWeb3Contract({
    abi: nftAbi,
    contractAddress: nftAddress,
    functionName: 'tokenURI',
    params: {
      tokenId: tokenId,
    },
  });

  async function updateUI() {
    const tokenURI = await getTokenURI();
    console.log(`The TokenURI is ${tokenURI}`);
    // We are going to cheat a little here...
    if (tokenURI) {
      // IPFS Gateway: A server that will return IPFS files from a "normal" URL.
      const requestURL = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      const tokenURIResponse = await (await fetch(requestURL)).json();
      const imageURI = tokenURIResponse.image;
      const imageURIURL = imageURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      setImageURI(imageURIURL);
      setTokenName(tokenURIResponse.name);
      setTokenDescription(tokenURIResponse.description);
      // We could render the Image on our sever, and just call our sever.
      // For testnets & mainnet -> use moralis server hooks
      // Have the world adopt IPFS
      // Build our own IPFS gateway
    }
    // get the tokenURI
    // using the image tag from the tokenURI, get the image
  }

  async function buyItem() {
    const listOptions = {
      abi: nftMarketplaceAbi,
      contractAddress: marketplaceAddress,
      functionName: 'buyItem',
      msgValue: price,
      params: {
        nftAddress: nftAddress,
        tokenId: tokenId,
      },
    };

    await runContractFunction({
      params: listOptions,
      onSuccess: handleBuySuccess,
      onError: (error) => console.log(error),
    });
  }

  async function cancelListing() {
    const listOptions = {
      abi: nftMarketplaceAbi,
      contractAddress: marketplaceAddress,
      functionName: 'cancelListing',
      params: {
        nftAddress: nftAddress,
        tokenId: tokenId,
      },
    };

    await runContractFunction({
      params: listOptions,
      onSuccess: handleCancelSuccess,
      onError: (error) => console.log(error),
    });
  }

  async function handleCancelSuccess(tx) {
    await tx.wait(1);
    dispatch({
      type: 'success',
      message: 'NFT canceled!',
      title: 'NFT listed',
      position: 'topR',
    });
    if (typeof window != 'undefined') {
      window.localStorage.setItem('handleCancel', 'true');
    }
    setUpdateCancel('updated');
  }

  async function handleBuySuccess(tx) {
    await tx.wait(1);
    dispatch({
      type: 'success',
      message: 'NFT bought!',
      title: 'NFT listed',
      position: 'topR',
    });
    if (typeof window != 'undefined') {
      window.localStorage.setItem('handleCancel', 'true');
    }
    setUpdateCancel('updated');
  }

  const { runContractFunction: updateListing } = useWeb3Contract({
    abi: nftMarketplaceAbi,
    contractAddress: marketplaceAddress,
    functionName: 'updateListing',
    params: {
      nftAddress: nftAddress,
      tokenId: tokenId,
      newPrice: ethers.utils.parseEther(newPrice || '0'),
    },
  });

  const handleUpdateListingSuccess = async (tx) => {
    await tx.wait(1);
    setNewPrice('0');
    dispatch({
      type: 'success',
      message: 'listing updated',
      title: 'Listing updated - please refresh (and move blocks)',
      position: 'topR',
    });
    setUpdateCancel('updated');
  };

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUI();
    }
  }, [isWeb3Enabled, modalEvent, updateCancel]);
  return (
    <div>
      <div className={styles.nftCard}>
        <Image
          loader={() => imageURI}
          className={styles.nftCardImg}
          src={imageURI}
          width={200}
          height={200}
        />
        <div className={styles.innerNftCard}>
          <span className={styles.innerNftCardTransparent}>
            Owned by:{' '}
            {seller.toLowerCase() === account.toLowerCase()
              ? 'You'
              : truncateStr(seller || '', 15)}
          </span>
        </div>
        <div className={styles.innerNftCard}>
          <span className={styles.innerNftCardTransparent}>NFT Name</span>
          <span className={styles.innerNftCardTransparent}>Price</span>
        </div>
        <div className={styles.innerNftCard}>
          <span className={styles.innerNftCardValue}>{tokenName}</span>
          <span className={styles.innerNftCardValue}>
            {ethers.utils.formatUnits(price, 'ether')} ETH
          </span>
        </div>
        {seller.toLowerCase() === account.toLowerCase() ? (
          <div className={styles.innerCardNftBtnContainer}>
            <button
              onClick={async () => {
                Swal.fire({
                  title: 'Input new price',
                  input: 'number',
                  inputAttributes: { step: 1 },
                  inputLabel: 'Your new price',
                  inputPlaceholder: 'Enter your new price',
                  showCancelButton: true,
                  showLoaderOnConfirm: true,
                  allowOutsideClick: false,
                  inputValidator: (value) => {
                    if (value.startsWith('.')) {
                      return 'Invalid input!';
                    }
                    if (value === '') {
                      return 'Cannot be empty or zero!';
                    }
                  },
                  preConfirm: (thisNewPrice) => {
                    setNewPrice(thisNewPrice);
                    return runContractFunction({
                      params: {
                        abi: nftMarketplaceAbi,
                        contractAddress: marketplaceAddress,
                        functionName: 'updateListing',
                        params: {
                          nftAddress: nftAddress,
                          tokenId: tokenId,
                          newPrice: ethers.utils.parseEther(
                            thisNewPrice || '0'
                          ),
                        },
                      },
                      onSuccess: handleUpdateListingSuccess,
                      onError: (error) => console.log(error),
                    });
                  },
                }).then(async (result) => {
                  console.log(result);
                });
              }}
              className={[styles.nftCardBtn, styles.nftBtnEditPrice].join(' ')}
            >
              Edit Price
            </button>
            <button
              className={[styles.nftCardBtn, styles.nftBtnCancel].join(' ')}
              onClick={() => {
                cancelListing();
              }}
            >
              Cancel Listing
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              buyItem();
            }}
            className={styles.nftCardBtn}
          >
            Buy NFT
          </button>
        )}
      </div>
    </div>
  );
}
