"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HiOutlineTrophy } from "react-icons/hi2";
import { LuCoins } from "react-icons/lu";
import { FaPlay } from "react-icons/fa";
import { BsPalette } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useGame } from "../contexts/GameContext";

const Start = () => {
  const router = useRouter();
  const { highScore } = useGame();
  return (
    <div className="bg-[#0F172A] h-full">
      <div className="flex flex-col justify-center items-center h-50">
        <p className="font-space text-4xl font-medium">SERPHIDA</p>
        <div className="font-space text-[12px] flex items-center gap-15 pt-5">
          <p>Modern Snake</p>
          <li>Web 3 Powerd</li>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center">
        <div className="flex gap-8">
          <Card className="bg-[#1B2A4E99] border-none font-raleway w-35 text-white  text-center">
            <CardHeader>
              <HiOutlineTrophy className="w-6 h-6 text-[#FDC200] ml-8 " />
              <CardTitle className="text-sm">High Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl -mt-7">{highScore}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1B2A4E99] border-none font-raleway w-35 text-white  text-center">
            <CardHeader>
              <LuCoins className="w-6 h-6 text-[#FF1414] ml-8 " />
              <CardTitle className="text-sm">Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl -mt-7">276</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center pt-10 space-y-5">
        <Button
          className=" py-6.5 bg-[#FF1414] flex gap-5 w-80 hover:bg-[#f76f6f] cursor-pointer hover:scale-105 "
          onClick={() => router.push("/game")}
        >
          <FaPlay className="" />
          <p>Start Game</p>
        </Button>
        <div className="flex gap-8">
          <Button
            className=" py-6.5 bg-white  flex gap-3 w-35 cursor-pointer hover:scale-105 hover:bg-gray-200"
            onClick={() => router.push("/skin")}
          >
            <BsPalette className="w-15 h-15 text-black" />
            <p className="text-[#FF1414]">Skin</p>
          </Button>
          <Button
            className=" py-6.5 bg-white  flex gap-3 w-35 cursor-pointer hover:scale-105 hover:bg-gray-200"
            onClick={() => router.push("/reward")}
          >
            <HiOutlineTrophy className="w-15 h-15 text-black" />
            <p className="text-[#FF1414]">Reward</p>
          </Button>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center mt-20 ">
        <p className="text-sm font-space">Use arrow key or swipe to move </p>
        <div className="font-space text-[12px] flex items-center gap-12 pt-1">
          <p>Eat</p>
          <li>Grow longer</li>
          <li>Earn Token </li>
        </div>
      </div>
    </div>
  );
};

export default Start;
