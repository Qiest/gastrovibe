import { Router } from 'express'
import { get, all } from '../db/init.js'

const router = Router()

router.get('/',      (_, res) => res.json({ posts: all('SELECT * FROM blog_posts ORDER BY created_at DESC') }))
router.get('/:slug', (req, res) => {
  const post = get('SELECT * FROM blog_posts WHERE slug=?', [req.params.slug])
  if (!post) return res.status(404).json({ error: 'Yazı bulunamadı.' })
  res.json({ post })
})

export default router
