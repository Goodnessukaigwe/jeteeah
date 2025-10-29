import { LuCoins } from "react-icons/lu";

interface AchievementCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  reward: number;
  isCompleted?: boolean;
}

const AchievementCard = ({
  icon,
  title,
  description,
  reward,
  isCompleted = true,
}: AchievementCardProps) => {
  return (
    <div className="border border-[#FF1414] bg-[#1B2A4E99] font-space space-y-5 p-2 rounded-md">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p>{title}</p>
          <p className="text-sm text-[#C7B2B2]">{description}</p>
        </div>
        <div className="flex gap-1 text-[#FF1414]">
          <LuCoins className="w-6 h-6 text-[#FF1414] ml-2" />
          <p>{reward}</p>
        </div>
      </div>
      <p className="text-[#FF1414] text-[12px] text-center">
        {isCompleted ? "completed" : "pending"}
      </p>
    </div>
  );
};

export default AchievementCard;
