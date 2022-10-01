import styles from '../styles/Home.module.css';
import { useEffect } from 'react';
import { useMoralis } from 'react-moralis';
import { BiSearchAlt } from 'react-icons/bi';
import Link from 'next/link';
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

export default function Header() {
  const {
    enableWeb3,
    isWeb3Enabled,
    isWeb3EnableLoading,
    account,
    Moralis,
    deactivateWeb3,
  } = useMoralis();

  useEffect(() => {
    if (
      !isWeb3Enabled &&
      typeof window !== 'undefined' &&
      window.localStorage.getItem('connected') == 'injected'
    ) {
      enableWeb3();
    }
  }, [isWeb3Enabled]);

  useEffect(() => {
    Moralis.onAccountChanged((account) => {
      if (account == null) {
        deactivateWeb3();
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('connected');
        }
      }
    });
  }, []);

  return (
    <nav className={styles.navbar}>
      <Link href="/">PsychoArt</Link>
      <div className={styles.navbarInputContainer}>
        <BiSearchAlt />
        <input type="text" placeholder="Search items and collections"></input>
      </div>
      <Link href="#">Collections</Link>
      <Link href="/sell-nft">Sell NFT</Link>
      <Link href="#">FAQ</Link>
      {account ? (
        <div className="ml-auto py-2 px-4">
          Connected to {account.slice(0, 6)}...
          {account.slice(account.length - 4)}
        </div>
      ) : (
        <button
          onClick={async () => {
            const res = await enableWeb3();
            console.log(res, "<<<<");
            if (!res) {
              Swal.fire({
                title: "You don't have Metamask downloaded!",
                html: "Please download Metamask at <a href='https://metamask.io/download/' target='_blank'>https://metamask.io/download/</a>",
                scrollbarPadding: 0,
              });
            }
            if (typeof window !== 'undefined' && res) {
              window.localStorage.setItem('connected', 'injected');
            }
          }}
          className={styles.navbarBtn}
        >
          Metamask Login
        </button>
      )}
    </nav>
  );
}
