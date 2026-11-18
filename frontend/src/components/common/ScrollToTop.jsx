import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop ensures every route transition scrolls window to top (0, 0)
 * rather than preserving the previous page's scroll position.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname, search]);

  return null;
}
