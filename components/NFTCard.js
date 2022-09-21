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
import Swal from 'sweetalert2';
import {ClipLoader, BeatLoader} from 'react-spinners';

const override = {
  display: 'block',
  margin: '0 auto',
  borderColor: 'red',
};

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
  imageUrl,
  tokenName,
  tokenDescription,
}) {
  const { isWeb3Enabled, account, chainId } = useMoralis();
  const chainString = chainId ? parseInt(chainId, 16).toString() : '31337';
  const router = useRouter();
  const [modalEvent, setModalEvent] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [buyItemLoading, setBuyItemLoading] = useState(false);
  const [cancelListingLoading, setCancelListingLoading] = useState(false);
  const [editPriceLoading, setEditPriceLoading] = useState(false);

  const { runContractFunction } = useWeb3Contract();

  const marketplaceAddress =
    chainString in networkMapping
      ? networkMapping[chainString].NftMarketplace[
          networkMapping[chainString].NftMarketplace.length - 1
        ]
      : '';

  const dispatch = useNotification();

  async function buyItem() {
    setBuyItemLoading(true);
    console.log(price.toString(), " <<<<<<");
    const decimals = 18;
    const bigNumberString = ethers.utils.parseUnits(price.toString(), decimals);
    const listOptions = {
      abi: nftMarketplaceAbi,
      contractAddress: marketplaceAddress,
      functionName: 'buyItem',
      msgValue: bigNumberString,
      params: {
        nftAddress: nftAddress,
        tokenId: tokenId,
      },
    };

    await runContractFunction({
      params: listOptions,
      onSuccess: handleBuySuccess,
      onError: (error) => {
        console.log(error);
        setBuyItemLoading(false);
      },
    });
  }

  async function cancelListing() {
    setCancelListingLoading(true);
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
      onError: (error) => {
        console.log(error);
        setCancelListingLoading(false);
      },
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
    setCancelListingLoading(false);
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
    setBuyItemLoading(false);
  }

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
    setEditPriceLoading(false);
  };

  useEffect(() => {
    // updateUI();
    // if (isWeb3Enabled) {
    // }
  }, [isWeb3Enabled, modalEvent, updateCancel]);
  return (
    <div>
      <div className={styles.nftCard}>
        <div
          onClick={() => {
            Swal.fire({
              title: 'NFT Details (Rinkeby Network)',
              html: `<div class=${styles.alignLeft}><b>NFT Address:</b> ${nftAddress}<br/>
                    <b>Token ID:</b> ${tokenId}<br/>
                    <b>NFT Name:</b> ${tokenName}<br/>
                    <b>Owned by:</b> ${seller}<br/>
                    <b>Price:</b> ${price} ETH<br/>
                    <b>Description:</b> ${tokenDescription}<div>`,
              imageUrl: imageUrl,
              imageWidth: 150,
              imageHeight: 150,
              imageAlt: 'Custom image',
            })
          }}>
        <Image
          loader={() => imageUrl}
          className={styles.nftCardImg}
          src={imageUrl}
          width={200}
          height={200}
        />
        <div className={styles.innerNftCard}>
          <span className={styles.innerNftCardTransparent}>
            Owned by:{' '}
            {seller.toLowerCase() === (account ? account.toLowerCase() : '')
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
          <span className={styles.innerNftCardValue}>{price} ETH</span>
          </div>
        </div>
        {chainString in networkMapping === false ? (
          <p>Please connect to Rinkeby Testnet</p>
        ) : !account ? (
          <p>Please login with your metamask account</p>
        ) : seller.toLowerCase() === (account ? account.toLowerCase() : '') ? (
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
                  preConfirm: async (thisNewPrice) => {
                    setEditPriceLoading(true);
                    setNewPrice(thisNewPrice);
                    let cont = true;
                    const res = await runContractFunction({
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
                      onError: (error) => {
                        console.log(error, " <<<<<????");
                        cont = false;
                        setEditPriceLoading(false);
                      },
                    });
                    console.log(res);
                    if (cont) {
                      await res.wait(1);
                    }
                    return res;
                  },
                }).then(async (result) => {
                  console.log(result);
                });
              }}
              className={[styles.nftCardBtn, styles.nftBtnEditPrice].join(' ')}
              disabled={editPriceLoading}
            >
              {editPriceLoading ? (
                <BeatLoader className={styles.chainErrorLoading} color="#36d7b7" />
              ) : (
                'Edit Price'
              )}
            </button>
            <button
              className={[styles.nftCardBtn, styles.nftBtnCancel].join(' ')}
              onClick={() => {
                cancelListing();
              }}
              disabled={cancelListingLoading}
            >
              {cancelListingLoading ? (
                <BeatLoader className={styles.chainErrorLoading} color="#36d7b7" />
              ) : (
                'Cancel Listing'
              )}
            </button>
          </div>
        ) : chainString in networkMapping === false ? (
          <p>Please connect to Rinkeby Testnet</p>
        ) : !account ? (
          <p>Please login with your metamask account</p>
        ) : (
          <button
            onClick={() => {
              buyItem();
            }}
            className={styles.nftCardBtn}
            disabled={buyItemLoading}
          >
            {buyItemLoading ? (
              <BeatLoader className={styles.chainErrorLoading} color="#36d7b7" />
            ) : (
              <span className={styles.nftCardBuy}>Buy NFT</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
