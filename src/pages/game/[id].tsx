// import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'

const Test = () => {
  const router = useRouter()
  return <div>{`Game id: ${router.query.id}`}</div>
}

// export const getStaticPaths: GetStaticPaths = async () => {
//   return {
//     paths: [
//       {
//         params: {
//           id: '1',
//         },
//       },
//     ],
//     fallback: true,
//   }
// }

// export const getStaticProps: GetStaticProps = async ({ params }) => {
//   if (params?.id == '1') {
//     return {
//       props: {
//         data: 'my id is 1',
//       },
//     }
//   }
//   return {
//     props: {
//       id: 'undefined id',
//     },
//   }
// }

export default Test
