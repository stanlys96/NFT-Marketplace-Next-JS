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
import { ClipLoader, BeatLoader } from 'react-spinners';
import axios from 'axios';

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
  handleSuccess,
  imageUrl,
  tokenName,
  tokenDescription,
}) {
  const { isWeb3Enabled, account, chainId } = useMoralis();
  const chainString = chainId ? parseInt(chainId, 16).toString() : '31337';
  const router = useRouter();
  const [modalEvent, setModalEvent] = useState('');
  const [newPrice, setNewPrice, getNewPrice] = useState('');
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
    console.log(price.toString(), ' <<<<<<');
    const decimals = 18;
    const bigNumberString = ethers.utils.parseUnits(price.toString(), decimals);
    const listOptions = {
      abi: nftMarketplaceAbi,
      contractAddress: marketplaceAddress,
      functionName: 'buyItem',
      msgValue: bigNumberString.toString(),
      params: {
        nftAddress: nftAddress,
        tokenId: tokenId,
      },
    };

    console.log(bigNumberString.toString(), ' <<<<<<< BIG NUMBER');

    await runContractFunction({
      params: listOptions,
      onSuccess: handleBuySuccess,
      onError: (error) => {
        console.log(error.message, '<<<<<');
        if (error.message.slice(0, 18).toLowerCase() === 'insufficient funds') {
          Swal.fire({
            title: 'Error!',
            text: 'Insufficient funds!',
            scrollbarPadding: 0,
          });
        }
        if (error.data) {
          if (
            error.data.message.slice(0, 18).toLowerCase() ===
            'insufficient funds'
          ) {
            Swal.fire({
              title: 'Error!',
              text: 'Insufficient funds!',
              scrollbarPadding: 0,
            });
          } else {
            Swal.fire({
              title: 'Error!',
              text: error.data.message,
              scrollbarPadding: 0,
            });
          }
        }
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
    const url = 'https://server-nft-marketplace.herokuapp.com/deleteActiveItem';
    let newPriceTemp = 0;
    await tx.wait(1);
    try {
      const response = await axios({
        url,
        method: 'DELETE',
        data: {
          nftAddress: nftAddress,
          tokenId: tokenId,
          price: price,
          seller: seller,
        },
      });
      if (response.status === 200) {
        console.log(response, ' <<<<');
      } else {
        console.log('ERROR!');
      }
    } catch (e) {
      console.log(e);
    }
    dispatch({
      type: 'success',
      message: 'NFT canceled!',
      title: 'NFT listed',
      position: 'topR',
    });
    if (typeof window != 'undefined') {
      window.localStorage.setItem('handleCancel', 'true');
    }
    handleSuccess();
    setCancelListingLoading(false);
  }

  async function handleBuySuccess(tx) {
    const url = 'https://server-nft-marketplace.herokuapp.com/updateItemSeller';
    await tx.wait(1);
    try {
      const response = await axios({
        url,
        method: 'PUT',
        data: {
          nftAddress: nftAddress,
          tokenId: tokenId,
          price: price,
          buyer: account,
          imageUrl: imageUrl,
          tokenName: tokenName,
          tokenDescription: tokenDescription,
          seller: seller,
        },
      });
      if (response.status === 200) {
        console.log(response, ' <<<<');
      } else {
        console.log('ERROR!');
      }
    } catch (e) {
      console.log(e);
    }
    dispatch({
      type: 'success',
      message: 'NFT bought!',
      title: 'NFT listed',
      position: 'topR',
    });
    if (typeof window != 'undefined') {
      window.localStorage.setItem('handleCancel', 'true');
    }
    handleSuccess();
    setBuyItemLoading(false);
  }

  const handleUpdateListingSuccess = async (tx, thisNewPrice) => {
    const url = 'https://server-nft-marketplace.herokuapp.com/updateItemPrice';
    // setLoading(true);
    let newPriceTemp = 0;
    await tx.wait(1);
    try {
      const response = await axios({
        url,
        method: 'PUT',
        data: {
          nftAddress: nftAddress,
          tokenId: tokenId,
          price: thisNewPrice,
          seller: seller,
        },
      });
      if (response.status === 200) {
        console.log(response, ' <<<<');
      } else {
        console.log('ERROR!');
        // setLoading(false);
      }
    } catch (e) {
      console.log(e);
    }
    setNewPrice('0');
    dispatch({
      type: 'success',
      message: 'listing updated',
      title: 'Listing updated - please refresh (and move blocks)',
      position: 'topR',
    });
    handleSuccess();
    setEditPriceLoading(false);
  };

  useEffect(() => {
    // updateUI();
    // if (isWeb3Enabled) {
    // }
  }, [isWeb3Enabled, modalEvent, newPrice]);
  return (
    <div>
      <div className={styles.nftCard}>
        <div
          className={styles.nftCardWrapper}
          onClick={() => {
            Swal.fire({
              title: 'NFT Details (Goerli Network)',
              html: `<div class=${styles.alignLeft}><div class=${styles.swalParagraph}><b>NFT Address:</b> ${nftAddress}<br/></div>
                    <div class=${styles.swalParagraph}><b>Token ID:</b> ${tokenId}<br/></div>
                    <div class=${styles.swalParagraph}><b>NFT Name:</b> ${tokenName}<br/></div>
                    <div class=${styles.swalParagraph}><b>Owned by:</b> ${seller}<br/></div>
                    <div class=${styles.swalParagraph}><b>Price:</b> ${price} ETH<br/></div>
                    <div class=${styles.swalParagraph}><b>Description:</b> ${tokenDescription}</div><div>`,
              imageUrl: imageUrl,
              imageWidth: 150,
              imageHeight: 150,
              imageAlt: 'Custom image',
              scrollbarPadding: 0,
            });
          }}
        >
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
              {seller.toLowerCase() ===
              (account ? account.toLowerCase() : '') ? (
                <span className={styles.textUnderline}>
                  <b>You</b>
                </span>
              ) : (
                truncateStr(seller || '', 15)
              )}
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
          <p>Please connect to Goerli Testnet</p>
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
                  scrollbarPadding: 0,
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
                      onSuccess: (tx) =>
                        handleUpdateListingSuccess(tx, thisNewPrice),
                      onError: (error) => {
                        console.log(error, ' <<<<<????');
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
                <BeatLoader size={8} color="#36d7b7" />
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
                <BeatLoader size={8} color="#36d7b7" />
              ) : (
                'Cancel Listing'
              )}
            </button>
          </div>
        ) : chainString in networkMapping === false ? (
          <p>Please connect to Goerli Testnet</p>
        ) : !account ? (
          <p>Please login with your metamask account</p>
        ) : (
          <button
            onClick={() => {
              buyItem();
            }}
            className={[styles.nftCardBtn, styles.nftBtnBuy].join(' ')}
            disabled={buyItemLoading}
          >
            {buyItemLoading ? (
              <BeatLoader size={8} color="#36d7b7" />
            ) : (
              <span className={styles.nftCardBuy}>Buy NFT</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
