"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HiOutlineTrophy } from "react-icons/hi2";
import { MdOutlineSwipe } from "react-icons/md";
import { RiProhibited2Line } from "react-icons/ri";
import { LuCoins } from "react-icons/lu";
import { FaPlay } from "react-icons/fa";
import { BsPalette } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useGame } from "../contexts/GameContext";
import { useLineraWallet } from "@/hooks/useLineraWallet";
import { FaHouse } from "react-icons/fa6";

const Start = () => {
  const router = useRouter();
  const { highScore, totalPoints, isBlockchainMode } = useGame();
  const { wallet } = useLineraWallet();

  return (
    <div className="bg-[#0F172A] min-h-screen pb-10">
      {/* Header Section */}
      <div className="flex flex-col justify-center items-center pt-8 pb-6">
        <p className="font-space text-5xl font-bold tracking-tight">JETEEAH</p>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-col justify-center items-center mt-4">
        <div className="flex gap-4">
          <Card className="bg-[#1B2A4E99] border-none font-raleway w-36 text-white text-center rounded-xl backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-center">
                <HiOutlineTrophy className="w-8 h-8 text-[#FDC200]" />
              </div>
              <CardTitle className="text-xs text-gray-400 font-normal">
                High Score
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold">{highScore}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1B2A4E99] border-none font-raleway w-36 text-white text-center rounded-xl backdrop-blur-sm">
            <CardHeader className="pb-1">
              <div className="flex justify-center">
                <LuCoins className="w-8 h-8 text-[#FF1414]" />
              </div>
              <CardTitle className="text-xs text-gray-400 font-normal">
                Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 ">
              {isBlockchainMode && wallet.connected ? (
                <>
                  <p className="text-3xl font-bold ">
                    {totalPoints.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-400 mt-1 font-medium">
                    🔗 Blockchain
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg text-gray-400">Connect</p>
                  <p className="text-xs text-gray-500 mt-1">wallet</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col justify-center items-center pt-10 space-y-5">
        <Button
          className="py-6.5 rounded-full bg-linear-to-r from-[#FF1414] to-[#CC0000] flex gap-3 w-77 hover:scale-105 transition-all shadow-lg shadow-red-500/30 border-none"
          onClick={() => router.push("/game")}
        >
          <FaPlay className="text-lg" />
          <span className="text-lg font-semibold">Start Game</span>
        </Button>
        <Button
          className="py-6.5 rounded-full bg-linear-to-r from-[#FF1414] to-[#CC0000] flex gap-3 w-77 hover:scale-105 transition-all shadow-lg shadow-red-500/30 border-none"
          onClick={() => router.push("/")}
        >
          <FaHouse className="text-lg" />
          <span className="text-lg font-semibold">Home</span>
        </Button>

        <div className="flex gap-4">
          {/* <Button
            className="py-6.5 rounded-full bg-white flex gap-2 w-36 cursor-pointer hover:scale-105 hover:bg-gray-100 transition-all shadow-md"
            onClick={() => router.push("/skin")}
          >
            <BsPalette className="w-5 h-5 text-black" />
            <span className="text-[#FF1414] font-semibold">Skins</span>
          </Button> */}
          <Button
            className="py-6.5 rounded-full bg-white flex gap-2 w-77 cursor-pointer hover:scale-105 hover:bg-gray-100 transition-all shadow-md"
            onClick={() => router.push("/reward")}
          >
            <HiOutlineTrophy className="w-5 h-5 text-black" />
            <span className="text-[#FF1414] font-semibold">Rewards</span>
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <footer className="flex flex-col items-center pb-2 mt-10 text-xs mx-8">
        <div className="w-full rounded-[20px] bg-white/5 p-2 text-center">
          <h3 className="font-bold ">How to Play</h3>
          <div className="mt-3 grid grid-cols-3 gap-2 text-white">
            <div className="flex flex-col items-center gap-1">
              <span className="border border-white rounded-full p-2">
                <MdOutlineSwipe className="text-lg" />
              </span>
              <p className="text-xs">Swipe</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="border border-white rounded-full p-4"></span>
              <p className="text-xs">Eat</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RiProhibited2Line className="text-3xl" />
              <p className="text-xs">Avoid</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Start;
