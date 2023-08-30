
export interface ExampleByIndustry {
  cardOriginalId: string
  questionId?: string
  data: string[]
}

export interface Industry {
  _id: string
  name: string
  examples?: ExampleByIndustry[]
}
