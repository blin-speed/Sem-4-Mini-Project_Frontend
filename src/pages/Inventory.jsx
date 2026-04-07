import { motion } from 'framer-motion'
import Catalog from './Catalog'

const Inventory = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
    <Catalog />
  </motion.div>
)

export default Inventory
