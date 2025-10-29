"use client";

import { Button } from "@/components/ui/button";
import { BsArrowLeft } from "react-icons/bs";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Wallet = () => {
  const router = useRouter();
  return (
    <div className="bg-[#0F172A] h-full">
      <div className="flex gap-23 items-center pt-7">
        <BsArrowLeft
          className="w-6 h-6 text-white ml-8 cursor-pointer"
          onClick={() => router.back()}
        />
        <p className="font-space text-xl font-medium">Wallet</p>
      </div>
      <div className="font-raleway grid grid-cols-2 mx-5 gap-5 mt-20 mb-15">
        <div className="bg-white w-40 text-black flex flex-col justify-center items-center p-2 rounded-md space-y-2 ">
          <div className="bg-[#F6851B1A] w-20 p-5 rounded-full">
            <Image src="/images/meta.png" alt="Image" width={50} height={50} />
          </div>
          <div className="text-center">
            <p className="text-xl">MetaMask</p>
            <p className="text-sm text-[#9CA3AF]">Popular</p>
          </div>
        </div>
        <div className="bg-white w-40 text-black flex flex-col justify-center items-center p-2 rounded-md space-y-2 ">
          <div className="bg-[#3B99FC1A] w-20 p-5 rounded-full">
            <Image src="/images/chain.png" alt="Image" width={50} height={50} />
          </div>
          <div className="text-center">
            <p className="text-lg">Wallet Connect</p>
            <p className="text-sm text-[#9CA3AF]">Mobile Friendly</p>
          </div>
        </div>
        <div className="bg-white w-40 text-black flex flex-col justify-center items-center p-2 rounded-md space-y-2 ">
          <div className="bg-[#0052FF1A] w-20 p-5 rounded-full">
            <Image src="/images/coin.png" alt="Image" width={50} height={50} />
          </div>
          <div className="text-center">
            <p className="text-xl">Coinbase</p>
            <p className="text-sm text-[#9CA3AF]">Easy to use</p>
          </div>
        </div>
        <div className="bg-white w-40 text-black flex flex-col justify-center items-center p-2 rounded-md space-y-2 ">
          <div className="bg-[#0052FF1A] w-20 p-5 rounded-full">
            <Image
              src="/images/avatar.png"
              alt="Image"
              width={50}
              height={50}
            />
          </div>
          <div className="text-center">
            <p className="text-xl">Guest Mode</p>
            <p className="text-sm text-[#9CA3AF]">Social Login</p>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <Button className="py-6.5 bg-[#FF1414] flex gap-5 w-80 hover:bg-[#f76f6f] cursor-pointer hover:scale-105">
          Connect Wallet
        </Button>
      </div>
    </div>
  );
};

export default Wallet;
