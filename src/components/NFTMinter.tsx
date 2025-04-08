"use client";

import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { Coins, Loader2, Upload } from "lucide-react";

export const NFTMinter: FC = () => {
  const { publicKey, wallet } = useWallet();
  const [nftName, setNftName] = useState("");
  const [nftSymbol, setNftSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [metadataUrl, setMetadataUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [nft, setNft] = useState<any>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadingImage(true);
      if (!e.target.files?.[0]) return;
      const file = e.target.files[0];
      setImageFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          // @ts-ignore
          headers: {
            pinata_api_key: process.env.PINATA_API_KEY,
            pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
          },
          body: formData,
        }
      );
      const data = await response.json();
      const image_link = `https://ipfs.io/ipfs/${data.IpfsHash}`;
      setImageUrl(image_link);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleMetadataUpload = async () => {
    setIsUploading(true);
    try {
      const metadata = {
        name: nftName,
        symbol: nftSymbol,
        description: description,
        image: imageUrl,
      };

      const response2 = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          // @ts-ignore
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: process.env.PINATA_API_KEY,
            pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
          },
          body: JSON.stringify(metadata),
        }
      );
      const data2 = await response2.json();
      console.log(`https://ipfs.io/ipfs/${data2.IpfsHash}`);
      setMetadataUrl(`https://ipfs.io/ipfs/${data2.IpfsHash}`);
    } catch (error) {
      console.error("Error uploading metadata:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMint = async () => {
    if (!wallet || !publicKey) return;

    try {
      setIsMinting(true);
      const connection = new Connection(clusterApiUrl("devnet"));
      const metaplex = new Metaplex(connection);
      metaplex.use(walletAdapterIdentity(wallet.adapter))
      const { nft } = await metaplex.nfts().create(
        {
          uri: metadataUrl,
          name: nftName,
          sellerFeeBasisPoints: 500,
          symbol: nftSymbol,
          creators: [
            {
              address: publicKey,
              share: 100,
            },
          ],
          isMutable: false,
        },
        { commitment: "finalized" }
      );

      console.log(`NFT created! Address: ${nft.address}`);
      setNft(`https://explorer.solana.com/address/${nft.address}?cluster=devnet`);
    } catch (error) {
      console.error("Error minting NFT:", error);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              NFT Minter
            </h1>
            <p className="text-gray-400 mt-2">
              Create and mint your NFTs on Solana
            </p>
          </div>
          <WalletMultiButton />
        </div>

        <div className="bg-gray-800/50 border-gray-700 p-8 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="nft-name">NFT Name</label>
                <input
                  id="nft-name"
                  value={nftName}
                  onChange={(e) => setNftName(e.target.value)}
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-gray-700/50 border-gray-600 mt-2"
                  placeholder="Enter NFT name"
                />
              </div>

              <div>
                <label htmlFor="nft-symbol">NFT Symbol</label>
                <input
                  id="nft-symbol"
                  value={nftSymbol}
                  onChange={(e) => setNftSymbol(e.target.value)}
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-gray-700/50 border-gray-600 mt-2"
                  placeholder="Enter NFT symbol"
                />
              </div>

              <div>
                <label htmlFor="nft-name">Description</label>
                <textarea
                  id="nft-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-gray-700/50 border-gray-600 mt-2"
                  placeholder="Enter NFT description"
                />
              </div>
              <div>
                <label htmlFor="nft-image">NFT Image</label>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-600/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="text-sm text-gray-400">
                        Click to upload or drag and drop
                      </p>
                    </div>
                    <input
                      id="nft-image"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {imagePreview && (
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-700">
                  <img
                    src={imagePreview}
                    alt="NFT Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <button
                onClick={handleMetadataUpload}
                disabled={isUploading || !imageFile || isUploadingImage}
                className="flex justify-center items-center w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {"Uploading..."}
                  </>
                ) : isUploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {"Uploading Image..."}
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    Upload Metadata
                  </>
                )}
              </button>
              <button
                onClick={handleMint}
                disabled={isMinting || metadataUrl == "" || imageUrl == ""}
                className="flex justify-center items-center w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {"Minting..."}
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    Mint NFT
                  </>
                )}
              </button>
            </div>
          </div>
          {nft && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">NFT Details</h2>
              <p className="text-gray-400">
                <a href={nft} target="_blank" rel="noopener noreferrer">
                  View NFT on Solana Explorer
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
