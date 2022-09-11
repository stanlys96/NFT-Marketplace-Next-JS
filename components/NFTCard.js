import styles from '../styles/Home.module.css';
import Image from 'next/image';

export default function NFTCard() {
  return (
    <div className={styles.nftCard}>
      <Image
        className={styles.nftCardImg}
        src="/img/bored_ape.jpeg"
        width={200}
        height={200}
      />
      <div className={styles.innerNftCard}>
        <span className={styles.innerNftCardTransparent}>@Johny</span>
        <span className={styles.innerNftCardTransparent}>Price</span>
      </div>
      <div className={styles.innerNftCard}>
        <span className={styles.innerNftCardValue}>Monkey Business</span>
        <span className={styles.innerNftCardValue}>0.025 ETH</span>
      </div>
      <button className={styles.nftCardBtn}>Buy NFT</button>
    </div>
  );
}
