import clsx from "clsx";
import Image from "next/image";

export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  return (
    <div
      className={clsx(
        "flex flex-none items-center justify-center border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black",
        {
          "h-[40px] w-[40px] rounded-xl": !size,
          "h-[30px] w-[30px] rounded-lg": size === "sm",
        },
      )}
    >
      <Image
        src="/brand/platun-symbol.svg"
        alt=""
        width={24}
        height={20}
        className={clsx({
          "h-auto w-[22px]": !size,
          "h-auto w-[17px]": size === "sm",
        })}
      />
    </div>
  );
}
