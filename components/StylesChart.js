import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFD600',
    height: 100
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black',
    marginRight: 5
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 15,
  },
  timePeriodScrollContainer: {
    paddingHorizontal: 15,
    paddingVertical: 0,
    backgroundColor: '#ffffff',
  },
  timePeriodItem: {
    paddingHorizontal: 15,
    paddingVertical: 4,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    width: 150,
    height: 50,
    alignItems: 'center',
  },
  timePeriodItemActive: {
    backgroundColor: '#ffcb00',
    borderColor: '#ffcb00',
  },
  timePeriodText: {
    color: '#aaa',
    fontSize: 17,
    alignItems: 'center',
  },
  timePeriodTextActive: {
    color: 'black',
    fontWeight: 'bold'
  },
  contentArea: {
    flex: 1,
    padding: 15,
  },
  expenseTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  expenseItem: {
    marginBottom: 5,
  },
  expenseText: {
    color: 'black',
    fontSize: 20,
  },
  chartButton: {
    backgroundColor: '#ffcb00',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15
  },
  chartButtonText: {
    fontWeight: 'bold'
  },
  chartTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center'
  },
  summaryText: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 8
  },
  noDataText: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 30
  },
  modalBackground: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center'
},
modalContainer: {
  width: '100%',
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 0,
  alignItems: 'center'
},
closeButton: {
  marginTop: 0,
  paddingVertical: 10,
  paddingHorizontal: 20,
  backgroundColor: '#ff5c5c',
  borderRadius: 8
},
closeButtonText: {
  color: '#fff',
  fontWeight: 'bold'
},
timePeriodControls: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    alignItems: 'center',
  },

  timePeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  timePeriodItemSmall: {
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 5,
  },

  timePeriodItemActiveSmall: {
    backgroundColor: '#4CAF50',
  },

  timePeriodTextSmall: {
    fontSize: 14,
    color: '#333',
  },

  timePeriodTextActiveSmall: {
    color: '#fff',
    fontWeight: 'bold',
  },

  arrowButton: {
    padding: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
    height: 30,
  },

  arrowDisabled: {
    opacity: 0.3,
  },

  arrowText: {
    fontSize: 16,
    color: '#333',
  },

  webMonthPagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10, 
    marginTop: 5,
    marginBottom: 10,
  },

});
