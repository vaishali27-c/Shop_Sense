import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from '../controllers/productController';
import {
  createOrder,
  getOrder,
  getOrders,
  updateOrderStatus,
} from '../controllers/orderController';
import { register, login, me as meUser, updateMe, logout as logoutUser } from '../controllers/authController';
import { adminLogin, adminMe, adminLogout } from '../controllers/adminAuthController';
import {
  listPages,
  getPage,
  summary,
  seed,
  recalculate,
} from '../controllers/contentIntelligenceController';
import { verifyUserToken, verifyAdminToken, requireAdmin, requireUser } from '../middleware/auth';
import { getInventory, updateInventory } from '../controllers/inventoryController';
import {
  getAnalyticsSummary,
  getSalesAnalytics,
  getTopProducts,
} from '../controllers/analyticsController';
import {
  startGoogleOAuth,
  googleOAuthCallback,
  getGoogleStatus,
  disconnectGoogle,
  saveGoogleSelection,
  getGscProperties,
  getGscReport,
  getGa4Properties,
  getGa4Report,
  getGa4DashboardReport,
} from '../controllers/googleController';

import { getWebsiteScore, testMlPrediction } from '../controllers/mlController';
import { askGeminiShoppingAssistant } from '../services/geminiShoppingService';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/addressController';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ShopSense API' });
});

apiRouter.post('/ai/shopping', async (req, res) => {
  try {
    const { query, products } = req.body as { query?: unknown; products?: unknown };

    if (typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        error: 'Query is required',
      });
    }

    if (!Array.isArray(products)) {
      return res.status(400).json({
        error: 'Products must be an array',
      });
    }

    const result = await askGeminiShoppingAssistant(query, products);
    return res.json(result);
  } catch (error) {
    console.error('[AI Shopping Route]', error);

    return res.status(500).json({
      error: 'Unable to process shopping request',
    });
  }
});

apiRouter.get('/products', getProducts);
apiRouter.get('/products/:id', getProduct);
// product management requires admin
apiRouter.post('/products', verifyAdminToken, requireAdmin, createProduct);
apiRouter.put('/products/:id', verifyAdminToken, requireAdmin, updateProduct);
apiRouter.delete('/products/:id', verifyAdminToken, requireAdmin, deleteProduct);

// Orders: admin sees all; logged-in users see their orders; unauthenticated gets fallback
apiRouter.use(verifyUserToken, verifyAdminToken);
apiRouter.get('/orders', getOrders);
apiRouter.get('/orders/:id', getOrder);
// placing orders requires an authenticated customer session
apiRouter.post('/orders', verifyUserToken, requireUser, createOrder);
apiRouter.put('/orders/:id/status', verifyAdminToken, requireAdmin, updateOrderStatus);
apiRouter.get('/addresses', verifyUserToken, requireUser, getAddresses);
apiRouter.post('/addresses', verifyUserToken, requireUser, createAddress);
apiRouter.put('/addresses/:id', verifyUserToken, requireUser, updateAddress);
apiRouter.delete('/addresses/:id', verifyUserToken, requireUser, deleteAddress);
apiRouter.put('/addresses/:id/default', verifyUserToken, requireUser, setDefaultAddress);

// inventory is admin-only
apiRouter.get('/inventory', verifyAdminToken, requireAdmin, getInventory);
apiRouter.put('/inventory/:productId', verifyAdminToken, requireAdmin, updateInventory);

// analytics/admin only
apiRouter.get('/analytics/summary', verifyAdminToken, requireAdmin, getAnalyticsSummary);
apiRouter.get('/analytics/sales', verifyAdminToken, requireAdmin, getSalesAnalytics);
apiRouter.get('/analytics/top-products', verifyAdminToken, requireAdmin, getTopProducts);

// user auth routes
apiRouter.post('/auth/register', register);
apiRouter.post('/auth/login', login);
apiRouter.get('/auth/me', verifyUserToken, requireUser, meUser);
apiRouter.put('/auth/me', verifyUserToken, requireUser, updateMe);
apiRouter.post('/auth/logout', logoutUser);

// admin auth (separate)
apiRouter.post('/admin/auth/login', adminLogin);
apiRouter.get('/admin/auth/me', verifyAdminToken, requireAdmin, adminMe);
apiRouter.post('/admin/auth/logout', adminLogout);

// Google OAuth callback is public but protected by its one-time persisted state.
apiRouter.get('/google/oauth/start', verifyAdminToken, requireAdmin, startGoogleOAuth);
apiRouter.get('/google/oauth/callback', googleOAuthCallback);
apiRouter.get('/google/status', verifyAdminToken, requireAdmin, getGoogleStatus);
apiRouter.post('/google/disconnect', verifyAdminToken, requireAdmin, disconnectGoogle);
apiRouter.put('/google/selection', verifyAdminToken, requireAdmin, saveGoogleSelection);
apiRouter.get('/google/search-console/properties', verifyAdminToken, requireAdmin, getGscProperties);
apiRouter.get('/google/search-console/performance', verifyAdminToken, requireAdmin, getGscReport);
apiRouter.get('/google/search-console/pages', verifyAdminToken, requireAdmin, getGscReport);
apiRouter.get('/google/search-console/queries', verifyAdminToken, requireAdmin, getGscReport);
apiRouter.get('/google/analytics/properties', verifyAdminToken, requireAdmin, getGa4Properties);
apiRouter.get('/google/analytics/report', verifyAdminToken, requireAdmin, getGa4Report);
apiRouter.get('/google/analytics/dashboard', verifyAdminToken, requireAdmin, getGa4DashboardReport);
apiRouter.get('/google/analytics/traffic', verifyAdminToken, requireAdmin, getGa4Report);
apiRouter.get('/google/analytics/events', verifyAdminToken, requireAdmin, getGa4Report);

// Content Intelligence — admin only
apiRouter.get('/content-intelligence/pages', verifyAdminToken, requireAdmin, listPages);
apiRouter.get('/content-intelligence/pages/:id', verifyAdminToken, requireAdmin, getPage);
apiRouter.get('/content-intelligence/summary', verifyAdminToken, requireAdmin, summary);
apiRouter.post('/content-intelligence/seed', verifyAdminToken, requireAdmin, seed);
apiRouter.post('/content-intelligence/recalculate', verifyAdminToken, requireAdmin, recalculate);

apiRouter.get(
  '/ml/test',
  verifyAdminToken,
  requireAdmin,
  testMlPrediction,
);
apiRouter.get('/ml/website-score', verifyAdminToken, requireAdmin, getWebsiteScore);