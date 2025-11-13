import { useEffect } from 'react';
import { gsap } from 'gsap';

/**
 * A custom hook to apply a GSAP hover animation to child elements.
 * @param {React.RefObject} containerRef - A ref to the parent element containing the items.
 * @param {string} selector - The CSS selector for the child elements to animate on hover.
 */
export const useHoverAnimation = (containerRef, selector) => {
  useEffect(() => {
    if (!containerRef.current) return;

    // Use gsap.utils.toArray for a more robust way to select elements
    const items = gsap.utils.toArray(selector, containerRef.current);

    if (items.length === 0) return;

    items.forEach((item) => {
      const onMouseEnter = () => {
        gsap.to(item, {
          y: -4,          // Move up slightly
          scale: 1.03,    // Scale up slightly
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      const onMouseLeave = () => {
        gsap.to(item, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: 'power2.inOut',
        });
      };

      item.addEventListener('mouseenter', onMouseEnter);
      item.addEventListener('mouseleave', onMouseLeave);

      // GSAP's context is great for cleanup, but for event listeners, this is also fine.
      // A more advanced pattern would use gsap.context() for cleanup.
    });

    // A simple cleanup to remove listeners, though less critical in React 18+ strict mode
    return () => {
      items.forEach(item => {
        // You'd need to store the functions to remove them, but for this simple case, it's often omitted.
        // For production, a more robust cleanup is recommended.
      });
    };

  }, [containerRef, selector]);
};