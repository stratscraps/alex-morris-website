export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-cms-password');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const password = req.headers['x-cms-password'];
  if (!password || password !== process.env.CMS_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const { file, data } = req.body;
  const allowed = ['homepage', 'private-works', 'public-works', 'offerings'];
  if (!allowed.includes(file)) {
    return res.status(400).json({ error: 'Invalid file name' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'stratscraps/alex-morris-website';
  const branch = process.env.GITHUB_BRANCH || 'main';
  const filePath = `src/data/${file}.json`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'stratscraps-cms',
  };

  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`,
      { headers }
    );
    if (!getRes.ok) {
      return res.status(502).json({ error: 'Failed to read file from GitHub' });
    }
    const { sha } = await getRes.json();

    const content = Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64');
    const putRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `cms: update ${file}`, content, sha, branch }),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.json();
      return res.status(502).json({ error: err.message || 'GitHub write failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
