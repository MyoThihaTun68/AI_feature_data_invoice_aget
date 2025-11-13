import { useEffect } from 'react';
import { gsap } from 'gsap';

// The custom hook that contains all GSAP logic
export const useSidebarAnimation = (sidebarRef) => {
  useEffect(() => {
    // Ensure the ref is connected before running animations
    if (!sidebarRef.current) return;

    const sidebar = sidebarRef.current;

    // Use GSAP's context for easier cleanup, which is best practice
    const ctx = gsap.context(() => {
      // Create a GSAP timeline for a sequence of animations
      const tl = gsap.timeline();

      // 1. Animate the logo
      tl.from('.app-logo', {
        opacity: 0,
        scale: 0.5,
        duration: 0.5,
        ease: 'power3.out',
      });

      // 2. Stagger-animate the main navigation links
      tl.from('.nav-link', {
        opacity: 0,
        x: -30,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power3.out',
      }, '-=0.2');

      // 3. Animate the user profile section
      tl.from('.user-profile', {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: 'power2.out',
      }, '-=0.3');

      // 4. Animate the bottom navigation items
      tl.from('.bottom-link', {
        opacity: 0,
        y: 20,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out',
      }, '-=0.2');
    }, sidebar); // Scope the selectors to the sidebar element

    // Cleanup function to revert animations when the component unmounts
    return () => ctx.revert();

  }, [sidebarRef]); // Rerun if the ref changes (it won't, but it's good practice)
};