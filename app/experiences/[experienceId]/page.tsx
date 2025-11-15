import { Button } from "@whop/react/components";
import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  // Ensure the user is logged in on whop.
  const { userId } = await whopsdk.verifyUserToken(await headers());

  // Fetch the neccessary data we want from whop.
  const [experience, user, access] = await Promise.all([
    whopsdk.experiences.retrieve(experienceId),
    whopsdk.users.retrieve(userId),
    whopsdk.users.checkAccess(experienceId, { id: userId }),
  ]);

  const displayName = user.name || `@${user.username}`;

  return (
    <div className="flex flex-col p-4 sm:p-6 lg:p-8 gap-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-6 sm:text-7 lg:text-9">
          Hi <strong>{displayName}</strong>!
        </h1>
        <Link
          href="https://docs.whop.com/apps"
          target="_blank"
          className="w-full sm:w-auto"
        >
          <Button variant="classic" className="w-full sm:w-auto" size="3">
            Developer Docs
          </Button>
        </Link>
      </div>

      <p className="text-3 text-gray-10">
        Welcome to you whop app! Replace this template with your own app. To get
        you started, here's some helpful data you can fetch from whop.
      </p>

      <h3 className="text-6 font-bold">Experience data</h3>
      <JsonViewer data={experience} />

      <h3 className="text-6 font-bold">User data</h3>
      <JsonViewer data={user} />

      <h3 className="text-6 font-bold">Access data</h3>
      <JsonViewer data={access} />
    </div>
  );
}

function JsonViewer({ data }: { data: any }) {
  return (
    <pre className="text-2 border border-gray-a4 rounded-lg p-4 bg-gray-a2 max-h-72 overflow-y-auto">
      <code className="text-gray-10">{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
}
