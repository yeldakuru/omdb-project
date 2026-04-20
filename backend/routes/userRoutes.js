import auth from "../middleware/authMiddleware.js";
import { getWatchlist, addToWatchlist } from "../controllers/userController.js";

const router = express.Router();

router.get("/watchlist", auth, getWatchlist);
router.post("/watchlist", auth, addToWatchlist);

export default router;