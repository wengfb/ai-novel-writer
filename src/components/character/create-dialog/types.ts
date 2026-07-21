export type CharacterFormData = {
  name: string
  nickname: string
  age: string
  gender: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  importance: string
  appearance: string
  personality: string
  backstory: string
  motivation: string
}

export function createDefaultCharacterForm(): CharacterFormData {
  return {
    name: '',
    nickname: '',
    age: '',
    gender: '',
    role: 'supporting',
    importance: '5',
    appearance: '',
    personality: '',
    backstory: '',
    motivation: '',
  }
}
