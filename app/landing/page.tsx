"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const Landing = () => {
  const router = useRouter();
  return (
    <div className="bg-[#27C04033] h-screen">
      <div className="flex flex-col items-center justify-center h-100">
        <Image src="/images/snake.png" alt="Image" width={150} height={150} />
        <p className="font-space text-4xl font-medium">JETEEAH</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 font-space text-lg ">
        <Button
          className="bg-white text-black w-80  py-6 text-lg hover:bg-gray-200 cursor-pointer hover:scale-105"
          onClick={() => router.push("/start")}
        >
          Play Game
        </Button>
        <Button className="bg-white text-black w-80 py-6 text-lg hover:bg-gray-200 cursor-pointer hover:scale-105">
          Settings
        </Button>
        <Button
          className="bg-white text-black w-80 py-6 text-lg hover:bg-gray-200 cursor-pointer hover:scale-105"
          onClick={() => router.push("/wallet")}
        >
          Connect Wallet
        </Button>
      </div>
    </div>
  );
};

export default Landing;
