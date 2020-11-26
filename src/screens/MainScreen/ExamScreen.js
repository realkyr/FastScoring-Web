import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Skeleton } from 'antd'

import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/storage'
import 'firebase/auth'

export default function ExamScreen () {
  const { examid } = useParams()
  const [exam, setExam] = useState(null)
  const [original, setOriginal] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const db = firebase.firestore()
    db.collection('exams')
      .doc(examid)
      .onSnapshot(async s => {
        if (!s.exists) setExam({})
        setExam({
          id: s.id,
          ...s.data()
        })

        if (original) return

        const examInfo = s.data()
        const qdoc = await examInfo.quiz.get()
        const qid = qdoc.id
        const user = firebase.auth().currentUser
        if (examInfo.status === 'done') {
          const storage = firebase.storage()
          const originalReference = storage.ref(
            'exams/' + user.uid + '/' +
              qid +
              '/' +
              `${examid}_${examInfo.filename}`
          )
          const url = await originalReference.getDownloadURL()
          setOriginal(url)

          const resultRef = storage.ref(examInfo.path_result)
          const resultUrl = await resultRef.getDownloadURL()
          setResult(resultUrl)
        }
      })
  }, [])

  const img = () => {
    if (original == null || result == null) {
      return <Skeleton paragraph={false} />
    }
    return (
      <>
        <img style={{ maxWidth: '700px' }} src={original} alt="original" />
        <img style={{ maxWidth: '700px' }} src={result} alt="result" />
      </>
    )
  }

  return <div>
    {exam === null
      ? (
        <Skeleton paragraph={false} active />
        )
      : exam.status === 'done'
        ? (
          <div>
            {img()}
            {Object.keys(exam.result).map(key => (
              <p key={key}>
                {key} {exam.result[key].correct ? 'ตอบถูก' : 'ตอบผิด'}
              </p>
            ))}
            <h4>คะแนนที่ได้ </h4>
            {
              Object.keys(exam.result).filter(key => {
                return exam.result[key].correct
              }).length
            }
          </div>
          )
        : (
            exam.status
          )}
  </div>
}
