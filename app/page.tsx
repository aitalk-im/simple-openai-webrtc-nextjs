import WebRTCConnection from "@/components/WebRTCConnection";


export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <WebRTCConnection />
      </div>
    </main>
  );
}