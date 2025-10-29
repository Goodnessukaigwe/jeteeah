"use client";

import { BsArrowLeft } from "react-icons/bs";
import { LuCoins } from "react-icons/lu";
import { HiOutlineGift } from "react-icons/hi";
import { TbTargetArrow } from "react-icons/tb";
import { FaBolt } from "react-icons/fa6";
import { HiOutlineTrophy } from "react-icons/hi2";
import { useRouter } from "next/navigation";
import AchievementCard from "@/components/AchievementCard";

const Page = () => {
  const router = useRouter();
  return (
    <div className="bg-[#0F172A] h-full overflow-y-scroll">
      <div className="flex gap-23 items-center pt-7">
        <BsArrowLeft
          className="w-6 h-6 text-white ml-8 cursor-pointer"
          onClick={() => router.back()}
        />
        <p className="font-space text-xl font-medium">Reward</p>
      </div>
      <div className="flex justify-end mr-7 mt-3">
        <p className="flex items-center gap-2 bg-[#1B2A4E99] p-1 rounded-3xl w-25 ">
          <LuCoins className="w-6 h-6 text-[#FF1414] ml-2" />
          <p>450</p>
        </p>
      </div>
      <div className="mx-5">
        <div className="border border-[#FF1414]  bg-[#1B2A4E99] font-space space-y-5 p-2 rounded-md mt-8">
          <div className="flex items-center gap-3">
            <HiOutlineGift className="w-6 h-6 text-[#FF1414]" />
            <div>
              <p>Token Reward</p>
              <p className="text-sm text-[#C7B2B2] pt-3">
                Complete achievement to unlock token
              </p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl">450</p>
            <p className="text-sm">Total Token Earned</p>
          </div>
        </div>
        <div className="font-space pt-3">
          <p>Achievement</p>
          <div className="space-y-3">
            <AchievementCard
              icon={
                <TbTargetArrow className="w-8 h-8 text-[#FF1414] bg-white p-1 rounded-full" />
              }
              title="First Step"
              description="Score 50 Points in a single Game"
              reward={50}
              isCompleted={true}
            />
            <AchievementCard
              icon={
                <FaBolt className="w-8 h-8 text-[#FF1414] bg-white p-1 rounded-full" />
              }
              title="Century"
              description="Score 100 Points in a single Game"
              reward={100}
              isCompleted={true}
            />
            <AchievementCard
              icon={
                <HiOutlineTrophy className="w-8 h-8 text-[#FF1414] bg-white p-1 rounded-full" />
              }
              title="Double Century"
              description="Score 200 Points in a single Game"
              reward={200}
              isCompleted={true}
            />
            <AchievementCard
              icon={
                <HiOutlineTrophy className="w-8 h-8 text-[#FF1414] bg-white p-1 rounded-full" />
              }
              title="Double Century"
              description="Score 200 Points in a single Game"
              reward={200}
              isCompleted={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
