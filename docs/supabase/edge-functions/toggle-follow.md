# toggle-follow

Takip / takibi bırak (idempotent). Hedef yalnızca `professional` veya `page`. Block filtresi uygulanır. Yeni takipte `follow` bildirimi tetiklenir.

**JWT:** açık · Body: `{ followerProfileId, followingProfileId }`
