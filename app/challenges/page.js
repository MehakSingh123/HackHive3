// app/challenges/page.js
import ChallengeLabs from '../components/ChallengeLabs'; // Adjust path if needed

export default function ChallengesPage() {
  return (
    // You might want a container or specific layout here
    <div className="flex-1 overflow-y-auto">
      <ChallengeLabs />
    </div>
  );
}

// Optional: Add metadata
export const metadata = {
  title: 'Challenge Labs - HackHive',
  description: 'Test your skills in isolated cybersecurity challenge environments.',
};
