import { Button } from "@/components/ui/button";
import { LuCoins } from "react-icons/lu";
import { FaCheck } from "react-icons/fa";
import { BiLockAlt } from "react-icons/bi";

interface SkinCardProps {
  color: string;
  name: string;
  isActive?: boolean;
  isLocked?: boolean;
  cost?: number;
  tag?: string;
  tagColor?: string;
  onSelect?: () => void;
}

const SkinCard = ({
  color,
  name,
  isActive = false,
  isLocked = false,
  cost,
  tag,
  tagColor,
  onSelect,
}: SkinCardProps) => {
  return (
    <div
      className={` flex items-center ${
        isActive ? "border border-[#F24436B2]" : ""
      } justify-between bg-[#20366999] rounded-md p-3 mx-5 `}
    >
      <div
        className="w-10 h-10 rounded-md "
        style={{ backgroundColor: color }}
      ></div>
      <div>
        <p>{name}</p>
        {tag && (
          <p
            className="border w-12 rounded-full pl-3 text-[12px]"
            style={{ borderColor: tagColor, color: tagColor }}
          >
            {tag}
          </p>
        )}
      </div>
      <Button
        className={`w-30 py-5.5 hover:scale-105 cursor-pointer hover:bg-red-400 ${
          isActive ? "bg-[#FF1414]" : isLocked ? "bg-[#444444]" : "bg-[#0076C6]"
        }`}
        onClick={onSelect}
      >
        {isActive ? (
          <>
            <FaCheck className="w-6 h-6 text-white ml-2" />
            <p className="text-lg">Active</p>
          </>
        ) : isLocked ? (
          <>
            <BiLockAlt className="w-8 h-8 text-[#777676]" />
            <p className="text-lg text-[#777676]">{cost}</p>
          </>
        ) : cost ? (
          <>
            <LuCoins className="w-6 h-6 text-white" />
            <p className="text-lg">{cost}</p>
          </>
        ) : (
          <p className="text-lg">Select</p>
        )}
      </Button>
    </div>
  );
};

export default SkinCard;
