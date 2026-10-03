import { useNavigate, Link } from 'react-router-dom';
import { useStudentExamJoin } from '../hooks/useStudentExamJoin';
import styles from './StudentExamJoinPage.module.css';

export function StudentExamJoinPage() {
  const navigate = useNavigate();
  const { pin, setPin, isLoading, error, joinExam } = useStudentExamJoin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await joinExam(pin);
    if (result?.exam?.id) {
      navigate(`/exam/${result.exam.id}`);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div>
          <h1 className={styles.title}>Вход на экзамен</h1>
          <p className={styles.subtitle}>
            Введите 6-значный PIN-код, предоставленный вашим преподавателем
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className={styles.pinInput}
            placeholder="000000"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            disabled={isLoading}
            autoFocus
            required
          />

          {error && <div className={styles.errorBox}>{error}</div>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading || pin.length !== 6}
          >
            {isLoading ? 'Проверка кода...' : 'Присоединиться'}
          </button>
        </form>

        <Link to="/" className={styles.homeLink}>
          ← Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
