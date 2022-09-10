import styles from '../styles/Home.module.css';
import Image from 'next/image';

export default function NFTCard() {
  return (
    <div className={styles.nftCard}>
      <Image
        className={styles.nftCardImg}
        src="/img/bored_ape.jpeg"
        width={250}
        height={250}
      />
      <div className={styles.innerNftCard}>
        <span>@Johny</span>
        <span>Price</span>
      </div>
      <div className={styles.innerNftCard}>
        <span>Monkey Business</span>
        <span>0.025 ETH</span>
      </div>
      <button className={styles.nftCardBtn}>Buy NFT</button>
    </div>
  );
}
