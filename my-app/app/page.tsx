import auth from "./auth/page";
import { redirect } from 'next/navigation'

export default function Home() {
  return (
    redirect('login') 
  );
}
