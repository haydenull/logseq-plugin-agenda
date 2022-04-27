import { useState } from 'react'

const knowledge = () => {
  const [knowledgeGraph, setKnowledgeGraph] = useState<API.knowledgeGraph>()

  return [knowledgeGraph, setKnowledgeGraph] as const
}

export default knowledge