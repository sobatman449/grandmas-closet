import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <span className="text-5xl">👗</span>
      <h2 className="text-xl font-semibold" style={{fontFamily:"'Cormorant Garamond',serif"}}>Page not found</h2>
      <Link href="/">
        <Button variant="outline">Back to My Closet</Button>
      </Link>
    </div>
  );
}
