import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { profilePath, type ProfileDefinition } from '../profiles';
import styles from './BottomNav.module.css';

export function BottomNav({ profile }: { profile: ProfileDefinition }) {
  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      <ul className={styles.list}>
        {profile.nav.map((item) => (
          <li key={item.id}>
            <NavLink
              to={profilePath(profile, item.path)}
              end={item.path === ''}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className={styles.indicator}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <item.icon size={22} strokeWidth={isActive ? 2.4 : 1.9} aria-hidden="true" />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
